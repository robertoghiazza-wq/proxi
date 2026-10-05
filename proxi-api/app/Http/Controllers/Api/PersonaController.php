<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PersonaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $persone = $this->scoped($request)
            ->withCount('eventi')
            ->when($request->q, fn ($q, $search) =>
                $q->where(fn ($q) =>
                    $q->where('nome', 'like', "%{$search}%")
                      ->orWhere('cognome', 'like', "%{$search}%")
                      ->orWhere('soprannome', 'like', "%{$search}%")
                ))
            ->when($request->ruolo, fn ($q, $r) => $q->where('ruolo', $r))
            ->orderBy('cognome')
            ->orderBy('nome')
            ->get();

        return response()->json($persone);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request));
        $telefoni = Arr::pull($data, 'telefoni');

        $this->assertIdentificabile($data);
        $data['institution_id'] = $request->user()->institution_id;
        $this->primoTelefono($data, $telefoni);

        $persona = DB::transaction(function () use ($data, $telefoni) {
            $persona = Persona::create($data);
            if ($telefoni !== null) {
                $this->syncTelefoni($persona, $telefoni);
            }

            return $persona;
        });

        return response()->json($persona->load('telefoni'), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $persona = $this->scoped($request)->findOrFail($id);

        return response()->json($persona->load([
            'telefoni',
            'eventi' => fn ($q) => $q->withCount('persone')->with('luogo'),
            'servizi' => fn ($q) => $q->select('servizi.id', 'servizi.nome', 'servizi.localita'),
        ]));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $persona = $this->scoped($request)->findOrFail($id);

        $data = $request->validate($this->rules($request));
        $telefoni = Arr::pull($data, 'telefoni');

        $this->assertIdentificabile($data, $persona);
        $this->primoTelefono($data, $telefoni);

        DB::transaction(function () use ($persona, $data, $telefoni) {
            $persona->update($data);
            if ($telefoni !== null) {
                $this->syncTelefoni($persona, $telefoni);
            }
        });

        return response()->json($persona->load('telefoni'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->scoped($request)->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function scoped(Request $request): Builder
    {
        return Persona::forInstitution($request->user()->institution_id);
    }

    private function rules(Request $request): array
    {
        $instId = $request->user()->institution_id;

        return [
            'ruolo'      => 'in:utente,dipendente,rete',
            'ruolo_id'   => ['nullable', Rule::exists('ruoli', 'id')->where('institution_id', $instId)->whereNull('deleted_at')],
            'nome'       => 'nullable|string|max:255',
            'cognome'    => 'nullable|string|max:255',
            'soprannome' => 'nullable|string|max:255',
            'anonimo'    => 'boolean',
            'data_nascita' => 'nullable|date|before_or_equal:today',
            'eta'        => 'nullable|integer|min:0|max:120',
            'sesso'      => 'nullable|in:M,F,altro',
            'lingue'     => 'nullable|array',
            'lingue.*'   => 'string|max:40',
            'tag'        => 'nullable|array',
            'tag.*'      => 'string|max:60',
            'bisogni'    => 'nullable|array',
            'bisogni.*'  => 'string|max:100',
            'note'       => 'nullable|string',
            'note_contatti' => 'nullable|string',
            'telefono'   => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
            'indirizzo'  => 'nullable|string|max:255',
            'npa'        => 'nullable|string|max:10',
            'localita'   => 'nullable|string|max:255',
            'comune_politico' => 'nullable|string|max:255',
            'bfs'        => 'nullable|string|max:6',
            'cantone'    => 'nullable|string|size:2',
            'paese'      => 'nullable|string|max:100',
            'telefoni'   => 'nullable|array|max:10',
            'telefoni.*.numero'    => 'required|string|max:40',
            'telefoni.*.etichetta' => 'nullable|string|max:60',
        ];
    }

    // Il primo numero resta anche nel campo storico `telefono` (ricerca e tasto "Chiama").
    private function primoTelefono(array &$data, ?array $telefoni): void
    {
        if ($telefoni !== null) {
            $data['telefono'] = isset($telefoni[0]['numero']) ? mb_substr(trim($telefoni[0]['numero']), 0, 30) : null;
        }
    }

    private function syncTelefoni(Persona $persona, array $telefoni): void
    {
        $prima = $persona->telefoni()->get(['etichetta', 'numero'])->toArray();
        $persona->telefoni()->delete();

        $righe = collect($telefoni)->values()->map(fn ($t, $i) => [
            'etichetta' => isset($t['etichetta']) && trim($t['etichetta']) !== '' ? trim($t['etichetta']) : null,
            'numero'    => trim($t['numero']),
            'ordine'    => $i,
        ]);
        $righe->each(fn ($r) => $persona->telefoni()->create($r));

        $dopo = $righe->map(fn ($r) => Arr::only($r, ['etichetta', 'numero']))->all();
        if ($prima !== $dopo) {
            AuditLog::record('updated', $persona, ['telefoni' => $prima], ['telefoni' => $dopo], ['relation' => 'telefoni']);
        }
    }

    // Serve almeno un nome, un cognome o un soprannome; una persona anonima mostra solo il soprannome.
    private function assertIdentificabile(array $data, ?Persona $esistente = null): void
    {
        $valore = fn (string $k) => array_key_exists($k, $data) ? $data[$k] : $esistente?->{$k};

        $nome       = trim((string) $valore('nome') . ' ' . (string) $valore('cognome'));
        $soprannome = trim((string) $valore('soprannome'));
        $anonimo    = (bool) $valore('anonimo');

        $errors = [];
        if ($nome === '' && $soprannome === '') {
            $errors['nome'] = ['Inserisci almeno un nome o un soprannome.'];
        }
        if ($anonimo && $soprannome === '') {
            $errors['soprannome'] = ['Una persona anonima ha bisogno di un soprannome.'];
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }
}
