<?php

use App\Models\Luogo;
use App\Support\ImportaLuoghi;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Importa i luoghi di FileMaker (già puliti: database/data/luoghi_iniziali.csv) nell'ente Prometheus e archivia i luoghi di prova.
// Ripetibile e sicura: i luoghi si aggiornano per id di FileMaker; i luoghi senza id di origine si archiviano solo se sono pochi (≤ 10).
return new class extends Migration
{
    public function up(): void
    {
        $ente = DB::table('institutions')->where('slug', 'prometheus')->orWhereRaw('lower(name) like ?', ['%prometheus%'])->orderBy('id')->first();
        if (! $ente) {
            Log::warning('Importazione luoghi iniziali: nessun ente Prometheus trovato, salto.');

            return;
        }

        $righe = ImportaLuoghi::leggi(database_path('data/luoghi_iniziali.csv'));
        $nProva = Luogo::forInstitution($ente->id)->whereDoesntHave('origini')->count();
        $archivia = $nProva <= 10;     // più di dieci luoghi non importati = dati veri: non si toccano

        $esito = ImportaLuoghi::analizza($ente->id, $righe, $archivia);
        if ($esito['errori']) {
            throw new RuntimeException('Importazione luoghi: '.implode(' ', array_slice($esito['errori'], 0, 5)));
        }

        ImportaLuoghi::applica($ente->id, $righe, $esito['da_archiviare']);
        Log::info(sprintf('Importazione luoghi iniziali: %d nuovi, %d aggiornati, %d archiviati.', $esito['nuovi'], $esito['aggiornati'], count($esito['da_archiviare'])));
    }

    public function down(): void
    {
        // dati importati: nessuna marcia indietro automatica
    }
};
