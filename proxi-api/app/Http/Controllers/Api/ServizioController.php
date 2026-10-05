<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Servizio;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ServizioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $servizi = $this->scoped($request)
            ->withCount('persone')
            ->when($request->q, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('nome', 'like', "%{$s}%")
                ->orWhere('localita', 'like', "%{$s}%")
                ->orWhere('indirizzo', 'like', "%{$s}%")))
            ->orderBy('nome')
            ->get();

        return response()->json($servizi);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['institution_id'] = $request->user()->institution_id;

        return response()->json(Servizio::create($data), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $servizio = $this->scoped($request)
            ->with(['persone' => fn ($q) => $q->select('persone.id', 'persone.nome', 'persone.soprannome', 'persone.anonimo', 'persone.ruolo', 'persone.telefono', 'persone.email')])
            ->findOrFail($id);

        $servizio->persone->each(fn ($p) => $p->pivot->principale = (bool) $p->pivot->principale);
        $servizio->setRelation('persone', $servizio->persone->sortByDesc(fn ($p) => (int) $p->pivot->principale)->values());

        return response()->json($servizio);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $servizio = $this->scoped($request)->findOrFail($id);
        $servizio->update($request->validate($this->rules(partial: true)));

        return response()->json($servizio);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->scoped($request)->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    // Sostituisce l'elenco dei contatti del servizio: [{persona_id, ruolo, principale}]
    public function syncPersone(Request $request, int $id): JsonResponse
    {
        $instId = $request->user()->institution_id;
        $servizio = $this->scoped($request)->findOrFail($id);

        $request->validate([
            'persone'              => 'present|array',
            'persone.*.persona_id' => ['required', 'distinct', Rule::exists('persone', 'id')
                ->where('institution_id', $instId)->whereNull('deleted_at')],
            'persone.*.ruolo'      => 'nullable|string|max:255',
            'persone.*.principale' => 'boolean',
        ], ['persone.*.persona_id.exists' => 'Una delle persone selezionate non esiste.']);

        $righe = collect($request->persone);
        $primoPrincipale = $righe->search(fn ($r) => ! empty($r['principale']));

        $sync = [];
        foreach ($righe as $i => $r) {
            $sync[$r['persona_id']] = [
                'ruolo'      => isset($r['ruolo']) && trim($r['ruolo']) !== '' ? trim($r['ruolo']) : null,
                'principale' => $primoPrincipale !== false && $i === $primoPrincipale,
            ];
        }

        $prima = $this->snapshot($servizio);
        DB::transaction(fn () => $servizio->persone()->sync($sync));
        $dopo = $this->snapshot($servizio);

        if ($prima !== $dopo) {
            AuditLog::record('updated', $servizio, ['persone' => $prima], ['persone' => $dopo], ['relation' => 'persone']);
        }

        return $this->show($request, $id);
    }

    private function snapshot(Servizio $servizio): array
    {
        return $servizio->persone()->get()
            ->map(fn ($p) => [
                'persona_id' => $p->id, 'ruolo' => $p->pivot->ruolo, 'principale' => (bool) $p->pivot->principale,
            ])
            ->sortBy('persona_id')->values()->all();
    }

    private function scoped(Request $request): Builder
    {
        return Servizio::forInstitution($request->user()->institution_id);
    }

    private function rules(bool $partial = false): array
    {
        return [
            'nome'      => ($partial ? 'sometimes|' : '') . 'required|string|max:255',
            'indirizzo' => 'nullable|string|max:255',
            'cap'       => 'nullable|string|max:10',
            'localita'  => 'nullable|string|max:255',
            'paese'     => 'nullable|string|max:100',
            'telefono'  => 'nullable|string|max:30',
            'email'     => 'nullable|email|max:255',
            'sito'      => 'nullable|string|max:255',
            'note'      => 'nullable|string',
            'lat'       => 'nullable|numeric|between:-90,90',
            'lng'       => 'nullable|numeric|between:-180,180',
            'attivo'    => 'boolean',
        ];
    }
}
