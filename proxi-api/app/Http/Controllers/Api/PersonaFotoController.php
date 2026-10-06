<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Foto della persona (facoltativa). Il browser la riduce prima dell'invio; qui solo controlli e archiviazione.
// Le persone anonime non hanno foto.
class PersonaFotoController extends Controller
{
    public function show(Request $request, int $id): StreamedResponse
    {
        $persona = $this->persona($request, $id);
        abort_unless($persona->foto_percorso && Storage::disk('local')->exists($persona->foto_percorso), 404);

        return Storage::disk('local')->response($persona->foto_percorso, null, [
            'Content-Type'           => 'image/jpeg',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control'          => 'private, max-age=3600',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $persona = $this->persona($request, $id);
        abort_if($persona->anonimo, 422, 'Una persona anonima non può avere una foto');

        $request->validate(
            ['foto' => 'required|file|max:5120|mimes:jpg,jpeg,png,webp'],
            ['foto.required' => 'Scegli una foto', 'foto.uploaded' => 'La foto non è arrivata al server', 'foto.max' => 'La foto è troppo grande', 'foto.mimes' => 'Formato non ammesso (JPG, PNG, WebP)'],
        );

        $vecchia = $persona->foto_percorso;
        $nuovo = $request->file('foto')->store("persone/{$persona->institution_id}/{$persona->id}/foto", 'local');
        $persona->update(['foto_percorso' => $nuovo]);
        AuditLog::record('updated', $persona, null, null, ['campo' => 'foto']);
        if ($vecchia) {
            Storage::disk('local')->delete($vecchia);
        }

        return response()->json($persona->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $persona = $this->persona($request, $id);
        if ($persona->foto_percorso) {
            Storage::disk('local')->delete($persona->foto_percorso);
            $persona->update(['foto_percorso' => null]);
            AuditLog::record('updated', $persona, null, null, ['campo' => 'foto', 'rimossa' => true]);
        }

        return response()->json($persona->fresh());
    }

    private function persona(Request $request, int $id): Persona
    {
        return Persona::forInstitution($request->user()->institution_id)->findOrFail($id);
    }
}
