<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Persona;
use App\Models\PersonaDiario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonaDiarioController extends Controller
{
    public function store(Request $request, int $personaId): JsonResponse
    {
        $persona = Persona::forInstitution($request->user()->institution_id)->findOrFail($personaId);
        abort_unless($persona->ruolo === 'utente', 404);

        $data = $request->validate([
            'data' => 'required|date|before_or_equal:today',
            'nota' => 'required|string|max:20000',
        ]);

        $voce = PersonaDiario::create($data + [
            'institution_id' => $persona->institution_id,
            'persona_id'     => $persona->id,
            'autore_id'      => $request->user()->id,
        ]);

        return response()->json($voce->load('autore:id,name'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $voce = $this->modificabile($request, $id);
        $voce->update($request->validate([
            'data' => 'sometimes|required|date|before_or_equal:today',
            'nota' => 'sometimes|required|string|max:20000',
        ]));

        return response()->json($voce->load('autore:id,name'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->modificabile($request, $id)->delete();

        return response()->json(null, 204);
    }

    // Si modifica una voce propria; coordinatori e admin possono modificare tutte.
    private function modificabile(Request $request, int $id): PersonaDiario
    {
        $user = $request->user();
        $voce = PersonaDiario::where('institution_id', $user->institution_id)->findOrFail($id);

        abort_unless($voce->autore_id === $user->id || in_array($user->role, ['coordinatore', 'admin'], true), 403);

        return $voce;
    }
}
