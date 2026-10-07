<?php

namespace App\Http\Controllers;

use App\Models\ImpostazioneApp;
use App\Models\Institution;
use App\Models\ReportAutomatico;
use App\Models\ReportInvio;
use App\Support\ReportBuilder;
use App\Support\ReportInvia;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Attività pianificata (da Plesk: recupera questo indirizzo ogni ora). Per ogni ente con invio automatico attivo,
// quando è passato il momento stabilito invia il resoconto della settimana appena finita, una sola volta.
class ReportCronController extends Controller
{
    public function esegui(Request $request): JsonResponse
    {
        $chiave = ImpostazioneApp::leggi('cron_token');
        abort_unless($chiave && hash_equals($chiave, (string) $request->query('chiave')), 403);

        $adesso = Carbon::now('Europe/Zurich');
        $esiti = [];

        foreach (ReportAutomatico::where('attivo', true)->get() as $a) {
            $ente = Institution::find($a->institution_id);
            if (! $ente || empty($a->destinatari)) continue;

            $scorsa = $adesso->copy()->subWeek();
            $etichetta = ReportBuilder::etichettaSettimana($scorsa);
            $quando = $adesso->copy()->startOfWeek()->addDays($a->giorno - 1)->setTime($a->ora, 0);
            if ($adesso->lt($quando) || $a->ultima_settimana === $etichetta) continue;

            $doc = ReportBuilder::settimana($ente, $scorsa->isoWeekYear, $scorsa->isoWeek, $a->nomi, (bool) $a->racconto);
            if ($doc['totali']['eventi'] === 0) {
                ReportInvio::create(['institution_id' => $ente->id, 'tipo' => 'automatico', 'riferimento' => $etichetta, 'destinatari' => $a->destinatari,
                    'nomi' => $a->nomi, 'racconto' => $a->racconto, 'con_pdf' => false, 'esito' => 'saltato', 'dettaglio' => 'Nessun evento svolto nella settimana.']);
                $a->forceFill(['ultima_settimana' => $etichetta, 'ultimo_invio_il' => now()])->save();
                $esiti[] = ['ente' => $ente->id, 'settimana' => $etichetta, 'esito' => 'saltato'];
                continue;
            }

            $invio = ReportInvia::invia($ente, null, 'automatico', $etichetta, $doc, $a->destinatari, $a->oggetto, $a->messaggio);
            if ($invio->esito === 'ok') {
                $a->forceFill(['ultima_settimana' => $etichetta, 'ultimo_invio_il' => now()])->save();
            }
            $esiti[] = ['ente' => $ente->id, 'settimana' => $etichetta, 'esito' => $invio->esito];
        }

        return response()->json(['eseguito_il' => $adesso->toIso8601String(), 'invii' => $esiti]);
    }
}
