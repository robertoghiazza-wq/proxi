<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImpostazioneApp;
use App\Models\Institution;
use App\Models\ReportAutomatico;
use App\Models\ReportInvio;
use App\Support\ReportBuilder;
use App\Support\ReportInvia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

// Report: resoconto settimanale, estratti di eventi (anche da inviare ai partner), invio automatico. Solo coordinatori e admin.
class ReportController extends Controller
{
    // ── Resoconto settimanale ───────────────────────────────────────────

    public function settimana(Request $request): JsonResponse
    {
        [$ente, $anno, $sett, $nomi, $racconto] = $this->parametriSettimana($request);

        return response()->json(ReportBuilder::settimana($ente, $anno, $sett, $nomi, $racconto) + ['pdf_disponibile' => ReportInvia::pdfDisponibile()]);
    }

    public function settimanaPdf(Request $request): Response
    {
        [$ente, $anno, $sett, $nomi, $racconto] = $this->parametriSettimana($request);

        return $this->pdf($ente, ReportBuilder::settimana($ente, $anno, $sett, $nomi, $racconto));
    }

    public function settimanaInvia(Request $request): JsonResponse
    {
        [$ente, $anno, $sett, $nomi, $racconto] = $this->parametriSettimana($request);
        $d = $this->parametriInvio($request);
        $doc = ReportBuilder::settimana($ente, $anno, $sett, $nomi, $racconto);

        return $this->esito(ReportInvia::invia($ente, $request->user(), 'settimana', sprintf('%d-W%02d', $anno, $sett), $doc, $d['destinatari'], $d['oggetto'] ?? null, $d['messaggio'] ?? null));
    }

    // ── Estratti di eventi ──────────────────────────────────────────────

    public function estratto(Request $request): JsonResponse
    {
        [$ente, $ids, $nomi, $racconto] = $this->parametriEstratto($request);

        return response()->json(ReportBuilder::estratto($ente, $ids, $nomi, $racconto) + ['pdf_disponibile' => ReportInvia::pdfDisponibile()]);
    }

    public function estrattoPdf(Request $request): Response
    {
        [$ente, $ids, $nomi, $racconto] = $this->parametriEstratto($request);

        return $this->pdf($ente, ReportBuilder::estratto($ente, $ids, $nomi, $racconto));
    }

    public function estrattoInvia(Request $request): JsonResponse
    {
        [$ente, $ids, $nomi, $racconto] = $this->parametriEstratto($request);
        $d = $this->parametriInvio($request);
        $doc = ReportBuilder::estratto($ente, $ids, $nomi, $racconto);

        return $this->esito(ReportInvia::invia($ente, $request->user(), 'estratto', 'eventi '.implode(',', array_slice($ids, 0, 10)), $doc, $d['destinatari'], $d['oggetto'] ?? null, $d['messaggio'] ?? null));
    }

    // ── Registro degli invii ────────────────────────────────────────────

    public function invii(Request $request): JsonResponse
    {
        $this->gestori($request);

        return response()->json(ReportInvio::where('institution_id', $request->user()->institution_id)->with('user:id,name')
            ->orderByDesc('id')->limit(40)->get());
    }

    // ── Invio automatico ────────────────────────────────────────────────

    public function automatico(Request $request): JsonResponse
    {
        $this->gestori($request);
        $a = ReportAutomatico::firstOrNew(['institution_id' => $request->user()->institution_id]);

        return response()->json($this->datiAutomatico($a, $request));
    }

    public function salvaAutomatico(Request $request): JsonResponse
    {
        $this->gestori($request);
        $d = $request->validate([
            'attivo'          => 'required|boolean',
            'giorno'          => 'required|integer|between:1,7',
            'ora'             => 'required|integer|between:0,23',
            'destinatari'     => 'present|array|max:20',
            'destinatari.*'   => 'email',
            'nomi'            => ['required', Rule::in(ReportBuilder::NOMI)],
            'racconto'        => 'required|boolean',
            'oggetto'         => 'nullable|string|max:200',
            'messaggio'       => 'nullable|string|max:3000',
        ], ['destinatari.*.email' => 'Uno degli indirizzi non è valido.']);
        abort_if($d['attivo'] && count($d['destinatari']) === 0, 422, 'Aggiungi almeno un destinatario per attivare l\'invio automatico.');

        $a = ReportAutomatico::updateOrCreate(['institution_id' => $request->user()->institution_id], $d);

        return response()->json($this->datiAutomatico($a, $request));
    }

    // Genera (o rigenera) la chiave segreta dell'attività pianificata: serve solo agli admin
    public function nuovaChiave(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        ImpostazioneApp::imposta('cron_token', Str::random(40));

        return $this->automatico($request);
    }

    // ── interni ─────────────────────────────────────────────────────────

    private function datiAutomatico(ReportAutomatico $a, Request $request): array
    {
        $token = ImpostazioneApp::leggi('cron_token');

        return [
            'attivo' => (bool) $a->attivo, 'giorno' => $a->giorno ?? 1, 'ora' => $a->ora ?? 8,
            'destinatari' => $a->destinatari ?? [], 'nomi' => $a->nomi ?? 'iniziali', 'racconto' => $a->racconto ?? true,
            'oggetto' => $a->oggetto, 'messaggio' => $a->messaggio,
            'ultima_settimana' => $a->ultima_settimana, 'ultimo_invio_il' => $a->ultimo_invio_il,
            'url_attivita' => $token && $request->user()->isAdmin() ? url('/api/cron/report').'?chiave='.$token : null,
            'chiave_presente' => (bool) $token,
        ];
    }

    private function pdf(Institution $ente, array $doc): Response
    {
        $pdf = ReportInvia::pdf(ReportInvia::html($doc, $ente));
        abort_if($pdf === null, 501, 'La libreria PDF non è installata sul server: carica la cartella vendor aggiornata.');

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.ReportInvia::nomeFile($doc).'"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function esito(ReportInvio $invio): JsonResponse
    {
        return response()->json($invio, $invio->esito === 'ok' ? 200 : 502);
    }

    private function gestori(Request $request): Institution
    {
        abort_unless($request->user()->isGestore(), 403);

        return Institution::findOrFail($request->user()->institution_id);
    }

    private function parametriSettimana(Request $request): array
    {
        $ente = $this->gestori($request);
        $d = $request->validate([
            'anno' => 'required|integer|between:2020,2100', 'settimana' => 'required|integer|between:1,53',
            'nomi' => ['sometimes', Rule::in(ReportBuilder::NOMI)], 'racconto' => 'sometimes|boolean',
        ]);

        return [$ente, (int) $d['anno'], (int) $d['settimana'], $d['nomi'] ?? 'completi', filter_var($d['racconto'] ?? true, FILTER_VALIDATE_BOOLEAN)];
    }

    private function parametriEstratto(Request $request): array
    {
        $ente = $this->gestori($request);
        $d = $request->validate([
            'ids' => 'required|array|min:1|max:100', 'ids.*' => 'integer',
            'nomi' => ['sometimes', Rule::in(ReportBuilder::NOMI)], 'racconto' => 'sometimes|boolean',
        ]);

        return [$ente, array_map('intval', $d['ids']), $d['nomi'] ?? 'completi', filter_var($d['racconto'] ?? true, FILTER_VALIDATE_BOOLEAN)];
    }

    private function parametriInvio(Request $request): array
    {
        return $request->validate([
            'destinatari' => 'required|array|min:1|max:20', 'destinatari.*' => 'email',
            'oggetto' => 'nullable|string|max:200', 'messaggio' => 'nullable|string|max:3000',
        ], ['destinatari.required' => 'Aggiungi almeno un destinatario.', 'destinatari.*.email' => 'Uno degli indirizzi non è valido.']);
    }
}
