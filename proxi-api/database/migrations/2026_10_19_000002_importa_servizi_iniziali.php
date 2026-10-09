<?php

use App\Support\ImportaLuoghi;
use App\Support\ImportaServizi;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Importa i servizi di FileMaker (già puliti: database/data/servizi_iniziali.csv) nell'ente Prometheus.
// Quelli già creati dall'importazione dei luoghi (ente di riferimento) si completano invece di duplicarsi.
return new class extends Migration
{
    public function up(): void
    {
        $ente = DB::table('institutions')->where('slug', 'prometheus')->orWhereRaw('lower(name) like ?', ['%prometheus%'])->orderBy('id')->first();
        if (! $ente) {
            Log::warning('Importazione servizi iniziali: nessun ente Prometheus trovato, salto.');

            return;
        }

        $mappa = ImportaServizi::applica($ente->id, ImportaLuoghi::leggi(database_path('data/servizi_iniziali.csv')));
        Log::info(sprintf('Importazione servizi iniziali: %d servizi.', count($mappa)));
    }

    public function down(): void
    {
        // dati importati: nessuna marcia indietro automatica
    }
};
