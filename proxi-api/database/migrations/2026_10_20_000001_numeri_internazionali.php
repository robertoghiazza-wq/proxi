<?php

use App\Support\Telefono;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Porta i numeri di telefono già salvati (persone, servizi) al formato internazionale: 079 123 45 67 -> +41 79 123 45 67.
// Cambia solo i numeri riconoscibili con certezza; gli altri (testo, interni, formati strani) restano com'erano. Ripetibile.
return new class extends Migration
{
    public function up(): void
    {
        $cambiati = 0;
        $intatti = [];

        foreach ([['persone', 'telefono'], ['persona_telefoni', 'numero'], ['servizi', 'telefono']] as [$tabella, $colonna]) {
            DB::table($tabella)->whereNotNull($colonna)->orderBy('id')->select(['id', $colonna])->chunkById(200, function ($righe) use ($tabella, $colonna, &$cambiati, &$intatti) {
                foreach ($righe as $r) {
                    $nuovo = Telefono::internazionale($r->$colonna);
                    if ($nuovo === null) {
                        if (trim((string) $r->$colonna) !== '' && ! str_starts_with(trim($r->$colonna), '+')) $intatti[] = "{$tabella}#{$r->id}";
                    } elseif ($nuovo !== $r->$colonna) {
                        DB::table($tabella)->where('id', $r->id)->update([$colonna => $nuovo]);
                        $cambiati++;
                    }
                }
            });
        }

        Log::info("Numeri internazionali: {$cambiati} aggiornati; non riconosciuti (lasciati come erano): ".($intatti ? implode(', ', $intatti) : 'nessuno'));
    }

    public function down(): void
    {
        // il formato precedente non si ricostruisce: nessuna marcia indietro
    }
};
