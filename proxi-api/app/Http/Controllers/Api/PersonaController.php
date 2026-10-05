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
            ->withCount('eventi')
            ->when($request->q, fn ($q, $search) =>
                $q->where(fn ($q) =>
                    $q->where('nome', 'like', "%{$search}%")
                      ->orWhere('soprannome', 'like', "%{$search}%")
                ))
            ->when($request->ruolo, fn ($q, $r) => $q->where('ruolo', $r))
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
            'lingue.*'   => 'string|max:40',
            'tag'        => 'nullable|array',
            'tag.*'      => 'string|max:60',
            'bisogni'    => 'nullable|array',
            'bisogni.*'  => 'string|max:100',
            'note'       => 'nullable|string',
            'telefono'   => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
        ]);

        $this->assertIdentificabile($data);

        $data['institution_id'] = $request->user()->institution_id;

        $persona = Persona::create($data);

        return response()->json($persona, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $persona = $this->scoped($request)->findOrFail($id);

        return response()->json($persona->load([
            'eventi' => fn ($q) => $q->withCount('persone')->with('luogo'),
        ]));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $persona = $this->scoped($request)->findOrFail($id);

        $data = $request->validate([
            'ruolo'      => 'in:utente,dipendente,rete',
            'nome'       => 'nullable|string|max:255',
            'soprannome' => 'nullable|string|max:255',
            'anonimo'    => 'boolean',
            'eta'        => 'nullable|integer|min:0|max:120',
            'sesso'      => 'nullable|in:M,F,altro',
            'lingue'     => 'nullable|array',
            'lingue.*'   => 'string|max:40',
            'tag'        => 'nullable|array',
            'tag.*'      => 'string|max:60',
            'bisogni'    => 'nullable|array',
            'bisogni.*'  => 'string|max:100',
            'note'       => 'nullable|string',
            'telefono'   => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
        ]);

        $this->assertIdentificabile($data, $persona);

        $persona->update($data);

        return response()->json($persona);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->scoped($request)->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function scoped(Request $request)
    {
        return Persona::forInstitution($request->user()->institution_id);
    }

    // Serve almeno un nome o un soprannome; una persona anonima mostra solo il soprannome.
    private function assertIdentificabile(array $data, ?Persona $esistente = null): void
    {
        $valore = fn (string $k) => array_key_exists($k, $data) ? $data[$k] : $esistente?->{$k};

        $nome       = trim((string) $valore('nome'));
        $soprannome = trim((string) $valore('soprannome'));
        $anonimo    = (bool) $valore('anonimo');

        $errors = [];
        if ($nome === '' && $soprannome === '') {
            $errors['nome'] = ['Inserisci almeno un nome o un soprannome.'];
        }
        if ($anonimo && $soprannome === '') {
            $errors['soprannome'] = ['Una persona anonima ha bisogno di un soprannome.'];
        }
        if ($errors) {
            throw \Illuminate\Validation\ValidationException::withMessages($errors);
        }
    }
}
