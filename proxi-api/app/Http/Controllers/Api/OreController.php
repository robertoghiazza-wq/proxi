<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OreMensile;
use App\Models\Persona;
use App\Support\ConteggioOre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Conteggio ore dei dipendenti: ognuno vede le proprie, coordinatori e admin quelle di tutti e correggono il mese.
class OreController extends Controller
{
    public function mese(Request $request, string $persona): JsonResponse
    {
        $p = $this->persona($request, $persona);
        [$anno, $mese] = $this->periodo($request);

        return response()->json(['persona' => $this->dto($p)] + (new ConteggioOre($p))->mese($anno, $mese));
    }

    public function anno(Request $request, string $persona): JsonResponse
    {
        $p = $this->persona($request, $persona);
        [$anno] = $this->periodo($request);

        return response()->json(['persona' => $this->dto($p)] + (new ConteggioOre($p))->anno($anno));
    }

    public function salvaMese(Request $request, string $persona): JsonResponse
    {
        abort_unless($this->gestore($request), 403);
        $p = $this->persona($request, $persona);

        $data = $request->validate([
            'anno'           => 'required|integer|between:2000,2100',
            'mese'           => 'required|integer|between:1,12',
            'vacanze_giorni' => 'nullable|numeric|between:0,31',
            'festivi_giorni' => 'nullable|numeric|between:0,31',
            'correzione_ore' => 'nullable|numeric|between:-500,500',
            'nota'           => 'nullable|string|max:255',
        ]);

        $voce = OreMensile::firstOrNew(['persona_id' => $p->id, 'anno' => $data['anno'], 'mese' => $data['mese']]);
        $voce->institution_id = $p->institution_id;
        $voce->fill([
            'vacanze_giorni' => $data['vacanze_giorni'] ?? 0,
            'festivi_giorni' => $data['festivi_giorni'] ?? 0,
            'correzione_ore' => $data['correzione_ore'] ?? 0,
            'nota'           => isset($data['nota']) && trim($data['nota']) !== '' ? trim($data['nota']) : null,
        ])->save();

        return $this->mese($request->merge(['anno' => $data['anno'], 'mese' => $data['mese']]), (string) $p->id);
    }

    private function persona(Request $request, string $id): Persona
    {
        $user = $request->user();

        if ($id === 'me') {
            abort_unless($user->persona_id, 422, 'Il tuo account non è collegato a una scheda dipendente: chiedi a un coordinatore di collegarlo.');
            $id = (string) $user->persona_id;
        }

        $persona = Persona::forInstitution($user->institution_id)->findOrFail((int) $id);
        abort_unless($persona->ruolo === 'dipendente', 404);
        abort_unless($this->gestore($request) || $user->persona_id === $persona->id, 403);

        return $persona;
    }

    private function periodo(Request $request): array
    {
        $v = $request->validate(['anno' => 'nullable|integer|between:2000,2100', 'mese' => 'nullable|integer|between:1,12']);

        return [(int) ($v['anno'] ?? now()->year), (int) ($v['mese'] ?? now()->month)];
    }

    private function dto(Persona $p): array
    {
        return ['id' => $p->id, 'nome' => trim("{$p->nome} {$p->cognome}") ?: ($p->soprannome ?? '—')];
    }

    private function gestore(Request $request): bool
    {
        return $request->user()->isGestore();
    }
}
