<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use App\Models\PersonaProfilo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

// Info, note e sostanze di una persona di tipo "utente". I dati sono sensibili: anche la lettura finisce nel log.
class PersonaProfiloController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $persona = $this->utente($request, $id);
        $this->registraLettura($request, $persona);

        return response()->json($this->payload($persona));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $persona = $this->utente($request, $id);

        $regole = ['sostanze' => 'sometimes|array|max:20'];
        foreach (PersonaProfilo::CAMPI as $campo) {
            $regole[$campo] = str_starts_with($campo, 'storia_') || $campo === 'progetti_interventi'
                ? 'sometimes|nullable|string|max:20000'
                : 'sometimes|nullable|string|max:' . ($campo === 'sport_hobby' ? 255 : 120);
        }
        foreach (['sostanza', 'con_chi', 'frequenza', 'abuso'] as $c) {
            $regole["sostanze.*.{$c}"] = 'nullable|string|max:120';
        }
        $regole['sostanze.*.note'] = 'nullable|string|max:255';
        $data = $request->validate($regole);

        $sostanze = Arr::pull($data, 'sostanze');

        DB::transaction(function () use ($persona, $request, $data, $sostanze) {
            $profilo = $persona->profilo ?? new PersonaProfilo(['persona_id' => $persona->id]);
            $profilo->institution_id = $request->user()->institution_id;
            $profilo->fill(array_map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v, $data));
            $profilo->save();

            if ($sostanze !== null) {
                $this->syncSostanze($persona, $sostanze);
            }
        });

        return response()->json($this->payload($persona->fresh()));
    }

    private function utente(Request $request, int $id): Persona
    {
        $persona = Persona::forInstitution($request->user()->institution_id)->findOrFail($id);
        abort_unless($persona->ruolo === 'utente', 404);

        return $persona;
    }

    private function payload(Persona $persona): array
    {
        $persona->load(['profilo', 'sostanze', 'diario.autore:id,name']);

        return [
            'profilo'  => $persona->profilo ?? array_fill_keys(PersonaProfilo::CAMPI, null),
            'sostanze' => $persona->sostanze,
            'diario'   => $persona->diario,
        ];
    }

    // Una sola riga di log per utente e persona ogni 10 minuti, per non riempire il registro a ogni apertura.
    private function registraLettura(Request $request, Persona $persona): void
    {
        $recente = AuditLog::where('user_id', $request->user()->id)
            ->where('action', 'viewed')
            ->where('auditable_type', 'Persona')
            ->where('auditable_id', $persona->id)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->exists();

        if (! $recente) {
            AuditLog::record('viewed', $persona, null, null, ['sezione' => 'profilo, note e diario']);
        }
    }

    private function syncSostanze(Persona $persona, array $righe): void
    {
        $prima = $persona->sostanze()->get(['sostanza', 'con_chi', 'frequenza', 'abuso', 'note'])->toArray();
        $persona->sostanze()->delete();

        $nuove = collect($righe)
            ->map(fn ($r) => Arr::only($r, ['sostanza', 'con_chi', 'frequenza', 'abuso', 'note']) + ['sostanza' => null, 'con_chi' => null, 'frequenza' => null, 'abuso' => null, 'note' => null])
            ->map(fn ($r) => array_map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v, $r))
            ->filter(fn ($r) => count(array_filter($r)) > 0)
            ->values();
        $nuove->each(fn ($r, $i) => $persona->sostanze()->create($r + ['ordine' => $i]));

        $dopo = $nuove->map(fn ($r) => Arr::only($r, ['sostanza', 'con_chi', 'frequenza', 'abuso', 'note']))->all();
        if ($prima !== $dopo) {
            AuditLog::record('updated', $persona, ['sostanze' => $prima], ['sostanze' => $dopo], ['relation' => 'sostanze']);
        }
    }
}
