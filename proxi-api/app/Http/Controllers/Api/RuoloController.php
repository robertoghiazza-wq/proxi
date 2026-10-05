<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ruolo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuoloController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->scoped($request)->where('attivo', true)->orderBy('ordine')->orderBy('nome_m')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->soloGestori($request);
        $data = $request->validate($this->rules());
        $data['institution_id'] = $request->user()->institution_id;
        $data['ordine'] ??= ((int) $this->scoped($request)->max('ordine')) + 10;

        return response()->json(Ruolo::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->soloGestori($request);
        $ruolo = $this->scoped($request)->findOrFail($id);
        $ruolo->update($request->validate($this->rules(partial: true)));

        return response()->json($ruolo);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->soloGestori($request);
        $this->scoped($request)->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function scoped(Request $request): Builder
    {
        return Ruolo::forInstitution($request->user()->institution_id);
    }

    private function soloGestori(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['coordinatore', 'admin'], true), 403);
    }

    private function rules(bool $partial = false): array
    {
        return [
            'nome_m'     => ($partial ? 'sometimes|' : '') . 'required|string|max:120',
            'nome_f'     => 'nullable|string|max:120',
            'nome_misto' => 'nullable|string|max:120',
            'ordine'     => 'nullable|integer|min:0|max:65000',
            'attivo'     => 'boolean',
        ];
    }
}
