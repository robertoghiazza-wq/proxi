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
            'lat'       => 'nullable|numeric',
            'lng'       => 'nullable|numeric',
            'attivo'    => 'boolean',
        ]);

        $data['institution_id'] = $request->user()->institution_id;
        $luogo = Luogo::create($data);

        return response()->json($luogo, 201);
    }

    public function show(Request $request, Luogo $luogo): JsonResponse
    {
        abort_if($request->user()->institution_id !== $luogo->institution_id, 403);

        return response()->json($luogo->load('eventi'));
    }

    public function update(Request $request, Luogo $luogo): JsonResponse
    {
        abort_if($request->user()->institution_id !== $luogo->institution_id, 403);

        $data = $request->validate([
            'nome'      => 'string|max:255',
            'tipo'      => 'in:strada,informale,diurno,sanitario,ufficio',
            'indirizzo' => 'nullable|string|max:255',
            'orari'     => 'nullable|string|max:255',
            'note'      => 'nullable|string',
            'lat'       => 'nullable|numeric',
            'lng'       => 'nullable|numeric',
            'attivo'    => 'boolean',
        ]);

        $luogo->update($data);

        return response()->json($luogo);
    }

    public function destroy(Request $request, Luogo $luogo): JsonResponse
    {
        abort_if($request->user()->institution_id !== $luogo->institution_id, 403);
        $luogo->delete();

        return response()->json(null, 204);
    }
}
