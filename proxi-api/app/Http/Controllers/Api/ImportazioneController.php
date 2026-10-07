<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ImportaLuoghi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Importazione dei luoghi da un CSV pulito. Solo admin. Senza `conferma` mostra solo cosa succederebbe.
class ImportazioneController extends Controller
{
    public function luoghi(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Solo un admin può importare dati.');
        $request->validate([
            'file'        => 'required|file|max:4096|mimes:csv,txt',
            'conferma'    => 'sometimes|boolean',
            'sostituisci' => 'sometimes|boolean',
        ], ['file.required' => 'Scegli il file CSV dei luoghi.', 'file.mimes' => 'Il file deve essere un CSV.']);

        $inst = $request->user()->institution_id;
        $righe = ImportaLuoghi::leggi($request->file('file')->getRealPath());
        abort_if(empty($righe), 422, 'Il file è vuoto.');
        abort_unless(isset($righe[0]['nome'], $righe[0]['tipo'], $righe[0]['id_filemaker']), 422, 'Mancano le colonne id_filemaker, nome e tipo: serve il file luoghi_puliti.csv.');

        $esito = ImportaLuoghi::analizza($inst, $righe, $request->boolean('sostituisci'));
        if (! $request->boolean('conferma') || $esito['errori']) {
            return response()->json($esito);
        }

        $mappa = ImportaLuoghi::applica($inst, $righe, $esito['da_archiviare']);

        return response()->json(['applicato' => true, 'mappa' => $mappa] + $esito);
    }
}
