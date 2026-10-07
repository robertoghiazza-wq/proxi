<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoriaEvento;
use App\Models\Evento;
use App\Models\Luogo;
use App\Models\TipoEvento;
use App\Models\TipoLuogo;
use App\Support\TipiDefault;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

// Impostazioni dell'ente: categorie e tipi di evento, tipi di luogo (con colore). Lettura per tutti, modifica per i gestori.
class TipiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $i = $request->user()->institution_id;

        $usiEventi = Evento::where('institution_id', $i)->selectRaw('tipo, count(*) as n')->groupBy('tipo')->pluck('n', 'tipo');
        $usiLuoghi = Luogo::where('institution_id', $i)->selectRaw('tipo, count(*) as n')->groupBy('tipo')->pluck('n', 'tipo');

        return response()->json([
            'colori'     => array_keys(TipiDefault::PALETTE),
            'categorie'  => CategoriaEvento::where('institution_id', $i)->orderBy('ordine')->orderBy('id')->get(),
            'tipi_evento' => TipoEvento::where('institution_id', $i)->orderBy('ordine')->orderBy('id')->get()
                ->map(fn ($t) => $t->toArray() + ['usi' => (int) ($usiEventi[$t->chiave] ?? 0)]),
            'tipi_luogo' => TipoLuogo::where('institution_id', $i)->orderBy('ordine')->orderBy('id')->get()
                ->map(fn ($t) => $t->toArray() + ['usi' => (int) ($usiLuoghi[$t->chiave] ?? 0)]),
        ]);
    }

    // ── Categorie di evento ─────────────────────────────────────────────

    public function storeCategoria(Request $request): JsonResponse
    {
        $this->gestori($request);
        $d = $request->validate(['nome' => 'required|string|max:80', 'colore' => ['required', $this->colore()]]);
        $d['colore'] = strtolower($d['colore']);
        $i = $request->user()->institution_id;
        $cat = CategoriaEvento::create($d + ['institution_id' => $i, 'ordine' => (int) CategoriaEvento::where('institution_id', $i)->max('ordine') + 1]);

        return response()->json($cat, 201);
    }

    public function updateCategoria(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $cat = CategoriaEvento::where('institution_id', $request->user()->institution_id)->findOrFail($id);
        $cat->update($request->validate(['nome' => 'sometimes|required|string|max:80', 'colore' => ['sometimes', $this->colore()], 'ordine' => 'sometimes|integer|min:0|max:1000']));

        return response()->json($cat);
    }

    public function destroyCategoria(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $cat = CategoriaEvento::where('institution_id', $request->user()->institution_id)->findOrFail($id);
        abort_if(TipoEvento::where('categoria_id', $cat->id)->exists(), 422, 'La categoria contiene dei tipi: spostali o eliminali prima.');
        $cat->delete();

        return response()->json(null, 204);
    }

    // ── Tipi di evento ──────────────────────────────────────────────────

    public function storeTipoEvento(Request $request): JsonResponse
    {
        $this->gestori($request);
        $i = $request->user()->institution_id;
        $d = $request->validate([
            'nome'         => 'required|string|max:80',
            'categoria_id' => ['required', Rule::exists('categorie_evento', 'id')->where('institution_id', $i)],
            'colore'       => ['nullable', $this->colore()],
        ]);
        $tipo = TipoEvento::create($d + [
            'institution_id' => $i,
            'chiave'         => $this->chiaveUnica('tipi_evento', $i, $d['nome']),
            'ordine'         => (int) TipoEvento::where('institution_id', $i)->max('ordine') + 1,
        ]);

        return response()->json($tipo->fresh(), 201);
    }

    public function updateTipoEvento(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $i = $request->user()->institution_id;
        $tipo = TipoEvento::where('institution_id', $i)->findOrFail($id);
        $tipo->update($request->validate([
            'nome'         => 'sometimes|required|string|max:80',
            'categoria_id' => ['sometimes', Rule::exists('categorie_evento', 'id')->where('institution_id', $i)],
            'colore'       => ['nullable', $this->colore()],
            'attivo'       => 'sometimes|boolean',
            'ordine'       => 'sometimes|integer|min:0|max:1000',
        ]));

        return response()->json($tipo);
    }

    public function destroyTipoEvento(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $i = $request->user()->institution_id;
        $tipo = TipoEvento::where('institution_id', $i)->findOrFail($id);
        $n = Evento::where('institution_id', $i)->where('tipo', $tipo->chiave)->count();
        abort_if($n > 0, 422, "Il tipo è usato da {$n} eventi: puoi disattivarlo ma non eliminarlo.");
        $tipo->delete();

        return response()->json(null, 204);
    }

    // ── Tipi di luogo ───────────────────────────────────────────────────

    public function storeTipoLuogo(Request $request): JsonResponse
    {
        $this->gestori($request);
        $i = $request->user()->institution_id;
        $d = $request->validate(['nome' => 'required|string|max:80', 'colore' => ['required', $this->colore()], 'riservato_default' => 'sometimes|boolean']);
        $tipo = TipoLuogo::create($d + [
            'institution_id' => $i,
            'chiave'         => $this->chiaveUnica('tipi_luogo', $i, $d['nome']),
            'ordine'         => (int) TipoLuogo::where('institution_id', $i)->max('ordine') + 1,
        ]);

        return response()->json($tipo, 201);
    }

    public function updateTipoLuogo(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $tipo = TipoLuogo::where('institution_id', $request->user()->institution_id)->findOrFail($id);
        $tipo->update($request->validate([
            'nome'   => 'sometimes|required|string|max:80',
            'colore' => ['sometimes', $this->colore()],
            'riservato_default' => 'sometimes|boolean',
            'attivo' => 'sometimes|boolean',
            'ordine' => 'sometimes|integer|min:0|max:1000',
        ]));

        return response()->json($tipo);
    }

    public function destroyTipoLuogo(Request $request, int $id): JsonResponse
    {
        $this->gestori($request);
        $i = $request->user()->institution_id;
        $tipo = TipoLuogo::where('institution_id', $i)->findOrFail($id);
        $n = Luogo::where('institution_id', $i)->where('tipo', $tipo->chiave)->count();
        abort_if($n > 0, 422, "Il tipo è usato da {$n} luoghi: puoi disattivarlo ma non eliminarlo.");
        $tipo->delete();

        return response()->json(null, 204);
    }

    private function gestori(Request $request): void
    {
        abort_unless($request->user()->isGestore(), 403);
    }

    // Un colore è un esadecimale #rrggbb scelto liberamente oppure, per i valori di partenza, la chiave di un colore della palette
    private function colore(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) {
            if (! is_string($value) || ! (preg_match('/^#[0-9a-fA-F]{6}$/', $value) || array_key_exists($value, TipiDefault::PALETTE))) {
                $fail('Il colore deve essere nel formato #rrggbb.');
            }
        };
    }

    // Chiave stabile ricavata dal nome (non cambia se poi si rinomina); unica per ente
    private function chiaveUnica(string $tabella, int $institutionId, string $nome): string
    {
        $base = Str::of(Str::slug($nome, '_'))->limit(50, '')->toString() ?: 'tipo';
        $chiave = $base;
        $n = 2;
        while (\DB::table($tabella)->where('institution_id', $institutionId)->where('chiave', $chiave)->exists()) {
            $chiave = "{$base}_{$n}";
            $n++;
        }

        return $chiave;
    }
}
