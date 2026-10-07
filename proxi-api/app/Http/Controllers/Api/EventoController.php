<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Evento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EventoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $eventi = Evento::forInstitution($instId)
            ->with($this->relazioni())
            ->when($request->data, fn ($q, $d) => $q->whereDate('data', $d))
            ->when($request->stato, fn ($q, $s) => $q->where('stato', $s))
            ->when($request->educatore_id, fn ($q, $id) => $q->where('educatore_id', $id))
            ->when($request->luogo_id, fn ($q, $id) => $q->where('luogo_id', $id))
            ->when($request->persona_id, fn ($q, $id) =>
                $q->whereHas('persone', fn ($q) => $q->where('persone.id', $id))
            )
            ->orderByDesc('data')
            ->orderBy('ora_inizio')
            ->get();

        return response()->json($eventi);
    }

    public function store(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $data = $request->validate([
            'luogo_id'     => ['required', $this->existsInInstitution('luoghi', $instId)],
            'tipo'         => 'required|string|max:50',
            'data'         => 'required|date',
            'ora_inizio'   => 'nullable|date_format:H:i',
            'durata_min'   => 'integer|min:1|max:1440',
            'stato'        => 'in:pianificato,in_corso,completato',
            'note'         => 'nullable|string',
            'persone_ids'   => 'sometimes|array',
            'persone_ids.*' => [$this->existsInInstitution('persone', $instId)],
            'soste'              => 'sometimes|array|max:20',
            'soste.*.luogo_id'   => ['nullable', $this->existsInInstitution('luoghi', $instId)],
            'soste.*.dalle'      => 'nullable|date_format:H:i',
            'soste.*.alle'       => 'nullable|date_format:H:i',
        ], $this->messages());

        $personeIds = Arr::pull($data, 'persone_ids');
        $soste = Arr::pull($data, 'soste');

        $data['institution_id'] = $instId;
        $data['educatore_id']   = $request->user()->id;

        $evento = DB::transaction(function () use ($data, $personeIds, $soste) {
            $evento = Evento::create($data);
            if ($personeIds !== null) {
                $this->syncPersoneAudited($evento, $personeIds);
            }
            if ($soste !== null) {
                $this->syncSoste($evento, $soste);
            }

            return $evento;
        });

        return response()->json($evento->load($this->relazioni(false)), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $evento = $this->scoped($request)
            ->with($this->relazioni())
            ->findOrFail($id);

        return response()->json($evento);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $instId = $request->user()->institution_id;
        $evento = $this->scoped($request)->findOrFail($id);

        $data = $request->validate([
            'luogo_id'     => ['sometimes', 'required', $this->existsInInstitution('luoghi', $instId)],
            'tipo'         => 'string|max:50',
            'data'         => 'date',
            'ora_inizio'   => 'nullable|date_format:H:i',
            'durata_min'   => 'integer|min:1|max:1440',
            'stato'        => 'in:pianificato,in_corso,completato',
            'note'         => 'nullable|string',
            'persone_ids'   => 'sometimes|array',
            'persone_ids.*' => [$this->existsInInstitution('persone', $instId)],
            'soste'              => 'sometimes|array|max:20',
            'soste.*.luogo_id'   => ['nullable', $this->existsInInstitution('luoghi', $instId)],
            'soste.*.dalle'      => 'nullable|date_format:H:i',
            'soste.*.alle'       => 'nullable|date_format:H:i',
        ], $this->messages());

        $personeIds = Arr::pull($data, 'persone_ids');
        $soste = Arr::pull($data, 'soste');
        $luogoCambiato = isset($data['luogo_id']) && (int) $data['luogo_id'] !== (int) $evento->luogo_id;

        DB::transaction(function () use ($evento, $data, $personeIds, $soste, $luogoCambiato) {
            $evento->update($data);
            if ($personeIds !== null) {
                $this->syncPersoneAudited($evento, $personeIds);
            }
            if ($soste !== null) {
                $this->syncSoste($evento, $soste);
            } elseif ($luogoCambiato && \Illuminate\Support\Facades\Schema::hasTable('evento_soste')) {
                $evento->soste()->delete();   // le tappe di prima non valgono più per il nuovo luogo
            }
        });

        return response()->json($evento->load($this->relazioni()));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $evento = $this->scoped($request)->findOrFail($id);
        $evento->delete();

        return response()->json(null, 204);
    }

    public function syncPersone(Request $request, int $id): JsonResponse
    {
        $evento = $this->scoped($request)->findOrFail($id);

        $request->validate([
            'persone_ids'   => 'present|array',
            'persone_ids.*' => [$this->existsInInstitution('persone', $request->user()->institution_id)],
        ], $this->messages());

        $this->syncPersoneAudited($evento, $request->persone_ids);

        return response()->json($evento->load('persone'));
    }

    // Sostituisce le tappe dell'evento; l'ordine è quello ricevuto
    private function syncSoste(Evento $evento, array $soste): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('evento_soste')) return;
        $evento->soste()->delete();
        foreach (array_values($soste) as $i => $s) {
            $evento->soste()->create(['luogo_id' => $s['luogo_id'] ?? null, 'dalle' => $s['dalle'] ?? null, 'alle' => $s['alle'] ?? null, 'ordine' => $i]);
        }
    }

    // Le tappe esistono dopo la migrazione: finché non è stata eseguita l'app funziona come prima
    private function relazioni(bool $educatore = true): array
    {
        $r = ['luogo', 'persone'];
        if ($educatore) $r[] = 'educatore:id,name';
        if (\Illuminate\Support\Facades\Schema::hasTable('evento_soste')) $r[] = 'soste.luogo:id,nome';

        return $r;
    }

    private function scoped(Request $request): Builder
    {
        return Evento::forInstitution($request->user()->institution_id);
    }

    private function existsInInstitution(string $table, int $instId)
    {
        return Rule::exists($table, 'id')
            ->where('institution_id', $instId)
            ->whereNull('deleted_at');
    }

    private function syncPersoneAudited(Evento $evento, array $ids): void
    {
        $prima = $evento->persone()->pluck('persone.id')->sort()->values()->all();
        $evento->persone()->sync($ids);
        $dopo = $evento->persone()->pluck('persone.id')->sort()->values()->all();

        if ($prima !== $dopo) {
            AuditLog::record(
                'updated', $evento,
                ['persone_ids' => $prima], ['persone_ids' => $dopo],
                ['relation' => 'persone'],
            );
        }
    }

    private function messages(): array
    {
        return [
            'luogo_id.required'      => 'Il luogo è obbligatorio.',
            'luogo_id.exists'        => 'Il luogo selezionato non esiste.',
            'persone_ids.*.exists'   => 'Una delle persone selezionate non esiste.',
        ];
    }
}
