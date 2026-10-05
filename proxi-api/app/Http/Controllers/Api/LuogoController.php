<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Luogo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LuogoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $luoghi = Luogo::forInstitution($instId)
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
            'tipo'      => 'required|in:strada,informale,diurno,sanitario,ufficio',
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
        ]);

        $data['institution_id'] = $request->user()->institution_id;
        $luogo = Luogo::create($data);

        return response()->json($luogo, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)
            ->withStats()
            ->findOrFail($id);

        return response()->json($luogo);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)->findOrFail($id);

        $data = $request->validate([
            'nome'      => 'string|max:255',
            'tipo'      => 'in:strada,informale,diurno,sanitario,ufficio',
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
        ]);

        $luogo->update($data);

        return response()->json($luogo);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $luogo = Luogo::forInstitution($request->user()->institution_id)->findOrFail($id);
        $luogo->delete();

        return response()->json(null, 204);
    }
}
