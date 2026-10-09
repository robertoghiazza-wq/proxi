<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Ricerca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Ricerca estesa per sezione (persone, luoghi, eventi, servizi): per ogni record trovato dice in quali campi compare la parola
class RicercaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $dati = $request->validate([
            'ambito' => 'required|in:persone,luoghi,eventi,servizi',
            'q'      => 'required|string|min:2|max:200',
        ]);

        $trovati = Ricerca::esegui($request->user()->institution_id, $dati['ambito'], $dati['q']);

        return response()->json(collect($trovati)->map(fn ($trovato, $id) => ['id' => (int) $id, 'trovato' => $trovato])->values());
    }
}
