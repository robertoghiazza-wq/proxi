<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vocabolo;
use App\Support\VocaboliDefault;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VocaboloController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'categorie' => VocaboliDefault::CATEGORIE,
            'voci' => $this->scoped($request)->where('attivo', true)->orderBy('categoria')->orderBy('ordine')->orderBy('valore')
                ->get(['id', 'categoria', 'valore', 'ordine']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->soloGestori($request);
        $data = $request->validate($this->regole($request));
        $data['institution_id'] = $request->user()->institution_id;
        $data['ordine'] = ((int) $this->scoped($request)->where('categoria', $data['categoria'])->max('ordine')) + 10;

        return response()->json(Vocabolo::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->soloGestori($request);
        $voce = $this->scoped($request)->findOrFail($id);
        $voce->update($request->validate([
            'valore' => ['required', 'string', 'max:120', Rule::unique('vocaboli', 'valore')
                ->where('institution_id', $voce->institution_id)->where('categoria', $voce->categoria)
                ->whereNull('deleted_at')->ignore($voce->id)],
        ]));

        return response()->json($voce);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->soloGestori($request);
        $this->scoped($request)->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function regole(Request $request): array
    {
        $categoria = (string) $request->input('categoria');

        return [
            'categoria' => ['required', Rule::in(array_keys(VocaboliDefault::CATEGORIE))],
            'valore'    => ['required', 'string', 'max:120', Rule::unique('vocaboli', 'valore')
                ->where('institution_id', $request->user()->institution_id)->where('categoria', $categoria)->whereNull('deleted_at')],
        ];
    }

    private function scoped(Request $request): Builder
    {
        return Vocabolo::forInstitution($request->user()->institution_id);
    }

    private function soloGestori(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['coordinatore', 'admin'], true), 403);
    }
}
