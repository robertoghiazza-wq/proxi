<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $eventi = Evento::forInstitution($instId)
            ->with(['luogo', 'persone', 'educatore:id,name'])
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
        $data = $request->validate([
            'luogo_id'   => 'nullable|exists:luoghi,id',
            'tipo'       => 'required|string|max:50',
            'data'       => 'required|date',
            'ora_inizio' => 'nullable|date_format:H:i',
            'durata_min' => 'integer|min:1|max:1440',
            'stato'      => 'in:pianificato,in_corso,completato',
            'note'       => 'nullable|string',
        ]);

        $data['institution_id'] = $request->user()->institution_id;
        $data['educatore_id']   = $request->user()->id;

        $evento = Evento::create($data);

        return response()->json($evento->load(['luogo', 'persone']), 201);
    }

    public function show(Request $request, Evento $evento): JsonResponse
    {
        abort_if($request->user()->institution_id !== $evento->institution_id, 403);

        return response()->json($evento->load(['luogo', 'persone', 'educatore:id,name']));
    }

    public function update(Request $request, Evento $evento): JsonResponse
    {
        abort_if($request->user()->institution_id !== $evento->institution_id, 403);

        $data = $request->validate([
            'luogo_id'   => 'nullable|exists:luoghi,id',
            'tipo'       => 'string|max:50',
            'data'       => 'date',
            'ora_inizio' => 'nullable|date_format:H:i',
            'durata_min' => 'integer|min:1|max:1440',
            'stato'      => 'in:pianificato,in_corso,completato',
            'note'       => 'nullable|string',
        ]);

        $evento->update($data);

        return response()->json($evento->load(['luogo', 'persone']));
    }

    public function destroy(Request $request, Evento $evento): JsonResponse
    {
        abort_if($request->user()->institution_id !== $evento->institution_id, 403);
        $evento->delete();

        return response()->json(null, 204);
    }

    public function syncPersone(Request $request, Evento $evento): JsonResponse
    {
        abort_if($request->user()->institution_id !== $evento->institution_id, 403);

        $request->validate(['persone_ids' => 'present|array', 'persone_ids.*' => 'exists:persone,id']);

        $evento->persone()->sync($request->persone_ids);

        return response()->json($evento->load('persone'));
    }
}
