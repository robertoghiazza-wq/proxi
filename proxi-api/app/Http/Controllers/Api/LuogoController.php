<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Luogo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LuogoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $luoghi = Luogo::forInstitution($instId)
            ->with('servizio:id,nome')
            ->withStats()
            ->attivi()
            ->when($request->q, fn ($q, $search) =>
                $q->where('nome', 'like', "%{$search}%"))
            ->orderBy('nome')
            ->get();

        return response()->json($luoghi);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'      => 'required|string|max:255',
            'tipo'      => ['required', \Illuminate\Validation\Rule::exists('tipi_luogo', 'chiave')->where('institution_id', $request->user()->institution_id)],
            'indirizzo' => 'nullable|string|max:255',
            'orari'     => 'nullable|string|max:255',
            'note'      => 'nullable|string',
            'npa'       => 'nullable|string|max:10',
            'localita'  => 'nullable|string|max:255',
            'comune_politico' => 'nullable|string|max:255',
            'bfs'       => 'nullable|string|max:6',
            'cantone'   => 'nullable|string|size:2',
            'lat'       => 'nullable|numeric',
            'lng'       => 'nullable|numeric',
            'attivo'    => 'boolean',
            'visibilita'   => 'in:pubblico,riservato',
            'punto_esatto' => 'nullable|string|max:120',
            'posizione_da_controllare' => 'sometimes|boolean',
            'servizio_id'  => ['nullable', \Illuminate\Validation\Rule::exists('servizi', 'id')->where('institution_id', $request->user()->institution_id)->whereNull('deleted_at')],
        ]);

        $data['institution_id'] = $request->user()->institution_id;
        $luogo = Luogo::create($data);

        return response()->json($luogo->fresh()->load('servizio:id,nome'), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)
            ->with('servizio:id,nome')
            ->withStats()
            ->findOrFail($id);

        // i luoghi riservati (case, ecc.): anche la lettura finisce nel log (una volta ogni 10 minuti)
        if ($luogo->visibilita === 'riservato') {
            $recente = AuditLog::where('user_id', $request->user()->id)->where('action', 'viewed')
                ->where('auditable_type', 'Luogo')->where('auditable_id', $luogo->id)
                ->where('created_at', '>=', now()->subMinutes(10))->exists();
            if (! $recente) {
                AuditLog::record('viewed', $luogo);
            }
        }

        return response()->json($luogo);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)->findOrFail($id);

        $data = $request->validate([
            'nome'      => 'string|max:255',
            'tipo'      => [\Illuminate\Validation\Rule::exists('tipi_luogo', 'chiave')->where('institution_id', $request->user()->institution_id)],
            'indirizzo' => 'nullable|string|max:255',
            'orari'     => 'nullable|string|max:255',
            'note'      => 'nullable|string',
            'npa'       => 'nullable|string|max:10',
            'localita'  => 'nullable|string|max:255',
            'comune_politico' => 'nullable|string|max:255',
            'bfs'       => 'nullable|string|max:6',
            'cantone'   => 'nullable|string|size:2',
            'lat'       => 'nullable|numeric',
            'lng'       => 'nullable|numeric',
            'attivo'    => 'boolean',
            'visibilita'   => 'in:pubblico,riservato',
            'punto_esatto' => 'nullable|string|max:120',
            'posizione_da_controllare' => 'sometimes|boolean',
            'servizio_id'  => ['nullable', \Illuminate\Validation\Rule::exists('servizi', 'id')->where('institution_id', $request->user()->institution_id)->whereNull('deleted_at')],
        ]);

        // modificare indirizzo o coordinate a mano vale come controllo della posizione
        $cambiata = (array_key_exists('lat', $data) && abs((float) $data['lat'] - (float) $luogo->lat) > 1e-7)
            || (array_key_exists('lng', $data) && abs((float) $data['lng'] - (float) $luogo->lng) > 1e-7)
            || (array_key_exists('indirizzo', $data) && trim((string) $data['indirizzo']) !== trim((string) $luogo->indirizzo));
        if ($cambiata) {
            $data['posizione_da_controllare'] = false;
        }
        $luogo->update($data);

        return response()->json($luogo->load('servizio:id,nome'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)->findOrFail($id);
        $luogo->delete();

        return response()->json(null, 204);
    }
}
