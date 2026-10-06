<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use App\Models\PersonaContratto;
use App\Support\Validazione;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Contratti dei dipendenti: dati sensibili, solo coordinatori e admin; anche la lettura finisce nel log.
class ContrattoController extends Controller
{
    public function index(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);

        $recente = AuditLog::where('user_id', $request->user()->id)->where('action', 'viewed')
            ->where('auditable_type', 'Persona')->where('auditable_id', $persona->id)
            ->where('meta->sezione', 'contratto')->where('created_at', '>=', now()->subMinutes(10))->exists();
        if (! $recente) {
            AuditLog::record('viewed', $persona, null, null, ['sezione' => 'contratto']);
        }

        return response()->json($persona->contratti()->get());
    }

    public function store(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);
        $data = $this->validati($request, false);

        $contratto = PersonaContratto::create($data + ['institution_id' => $persona->institution_id, 'persona_id' => $persona->id]);

        return response()->json($contratto->fresh(), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $contratto = $this->contratto($request, $id);
        $contratto->update($this->validati($request, true, $contratto));

        return response()->json($contratto->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->contratto($request, $id)->delete();

        return response()->json(null, 204);
    }

    private function validati(Request $request, bool $parziale, ?PersonaContratto $esistente = null): array
    {
        $dataInizio = $request->input('data_inizio', $esistente?->data_inizio?->toDateString());
        $s = $parziale ? 'sometimes|' : '';

        $data = $request->validate([
            'data_inizio'     => $s . 'required|date',
            'data_fine'       => ['nullable', 'date', $dataInizio ? 'after_or_equal:' . $dataInizio : 'date'],
            'stipendio_annuo' => 'nullable|numeric|min:0|max:9999999.99',
            'grado'           => 'nullable|numeric|between:0,100',
            'ore_settimanali' => 'nullable|numeric|between:0,80',
            'cassa_malati'    => 'nullable|string|max:120',
            'note'            => 'nullable|string|max:5000',
            'iban'            => ['nullable', 'string', fn ($a, $v, $fail) => $v === null || Validazione::iban($v) ? null : $fail('IBAN non valido: controlla le cifre.')],
            'avs'             => ['nullable', 'string', fn ($a, $v, $fail) => $v === null || Validazione::avs($v) ? null : $fail('Numero AVS non valido: deve essere 756.XXXX.XXXX.XX.')],
        ]);

        if (! empty($data['iban'])) {
            $data['iban'] = Validazione::iban($data['iban']);
        }
        if (! empty($data['avs'])) {
            $data['avs'] = Validazione::avs($data['avs']);
        }

        return array_map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v, $data);
    }

    private function dipendente(Request $request, int $id): Persona
    {
        $this->soloGestori($request);
        $persona = Persona::forInstitution($request->user()->institution_id)->findOrFail($id);
        abort_unless($persona->ruolo === 'dipendente', 404);

        return $persona;
    }

    private function contratto(Request $request, int $id): PersonaContratto
    {
        $this->soloGestori($request);

        return PersonaContratto::where('institution_id', $request->user()->institution_id)->findOrFail($id);
    }

    private function soloGestori(Request $request): void
    {
        abort_unless($request->user()->isGestore(), 403);
    }
}
