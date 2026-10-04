<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Persona;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instId = $request->user()->institution_id;

        $persone = Persona::forInstitution($instId)
            ->when($request->q, fn ($q, $search) =>
                $q->where(fn ($q) =>
                    $q->where('nome', 'like', "%{$search}%")
                      ->orWhere('soprannome', 'like', "%{$search}%")
                ))
            ->orderBy('nome')
            ->get();

        return response()->json($persone);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ruolo'      => 'in:utente,dipendente,rete',
            'nome'       => 'nullable|string|max:255',
            'soprannome' => 'nullable|string|max:255',
            'anonimo'    => 'boolean',
            'eta'        => 'nullable|integer|min:0|max:120',
            'sesso'      => 'nullable|in:M,F,altro',
            'lingue'     => 'nullable|array',
            'tag'        => 'nullable|array',
            'bisogni'    => 'nullable|array',
            'note'       => 'nullable|string',
            'telefono'   => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
        ]);

        $data['institution_id'] = $request->user()->institution_id;

        $persona = Persona::create($data);

        return response()->json($persona, 201);
    }

    public function show(Request $request, Persona $persona): JsonResponse
    {
        $this->authorizeInstitution($request, $persona->institution_id);

        return response()->json($persona->load('eventi'));
    }

    public function update(Request $request, Persona $persona): JsonResponse
    {
        $this->authorizeInstitution($request, $persona->institution_id);

        $data = $request->validate([
            'ruolo'      => 'in:utente,dipendente,rete',
            'nome'       => 'nullable|string|max:255',
            'soprannome' => 'nullable|string|max:255',
            'anonimo'    => 'boolean',
            'eta'        => 'nullable|integer|min:0|max:120',
            'sesso'      => 'nullable|in:M,F,altro',
            'lingue'     => 'nullable|array',
            'tag'        => 'nullable|array',
            'bisogni'    => 'nullable|array',
            'note'       => 'nullable|string',
            'telefono'   => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
        ]);

        $persona->update($data);

        return response()->json($persona);
    }

    public function destroy(Request $request, Persona $persona): JsonResponse
    {
        $this->authorizeInstitution($request, $persona->institution_id);
        $persona->delete();

        return response()->json(null, 204);
    }

    private function authorizeInstitution(Request $request, int $institutionId): void
    {
        abort_if($request->user()->institution_id !== $institutionId, 403);
    }
}
