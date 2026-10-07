<?php

namespace App\Support;

use App\Models\Institution;
use App\Models\ReportInvio;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

// Rende i resoconti in HTML/PDF e li invia per e-mail (un messaggio per destinatario, così non vedono gli altri indirizzi).
class ReportInvia
{
    public static function pdfDisponibile(): bool
    {
        return class_exists(\Dompdf\Dompdf::class);
    }

    public static function html(array $doc, Institution $ente): string
    {
        $p = $doc['privacy'];
        $parti = [];
        if ($p['nomi'] === 'iniziali') $parti[] = 'con i nomi ridotti alle iniziali';
        if ($p['nomi'] === 'nessuno') $parti[] = 'senza i nomi delle persone';
        if (! $p['racconto']) $parti[] = 'senza il racconto degli eventi';
        $nota = $parti ? 'Documento '.implode(' e ', $parti).'.' : null;

        return view('report.documento', ['doc' => $doc, 'accento' => $ente->accent_color ?: '#dc1d27', 'nota' => $nota])->render();
    }

    // null se la libreria PDF non è installata sul server
    public static function pdf(string $html): ?string
    {
        if (! self::pdfDisponibile()) return null;

        $cartella = storage_path('app/dompdf');
        if (! is_dir($cartella)) @mkdir($cartella, 0775, true);

        $opzioni = new \Dompdf\Options();
        $opzioni->set('isRemoteEnabled', false);
        $opzioni->set('defaultFont', 'Helvetica');
        $opzioni->set('fontDir', $cartella);
        $opzioni->set('fontCache', $cartella);
        $dompdf = new \Dompdf\Dompdf($opzioni);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }

    public static function nomeFile(array $doc): string
    {
        $base = isset($doc['periodo'])
            ? "Resoconto-settimana-{$doc['periodo']['settimana']}-{$doc['periodo']['anno']}"
            : 'Estratto-eventi'.(! empty($doc['giorni']) ? '-'.$doc['giorni'][0]['data'] : '');

        return Str::slug($base, '-').'.pdf';
    }

    public static function oggettoPredefinito(array $doc, Institution $ente): string
    {
        return $doc['titolo'].' – '.$ente->name;
    }

    public static function messaggioPredefinito(array $doc, Institution $ente): string
    {
        $cosa = isset($doc['periodo']) ? 'il resoconto settimanale' : 'l\'estratto degli eventi richiesto';

        return "Buongiorno,\n\nin allegato {$cosa}".($doc['sottotitolo'] ? " ({$doc['sottotitolo']})" : '').".\n\nCordiali saluti\n{$ente->name}";
    }

    // Invia e registra l'esito. Non lancia eccezioni: l'errore finisce nel registro e viene restituito.
    public static function invia(Institution $ente, ?User $user, string $tipo, string $riferimento, array $doc, array $destinatari, ?string $oggetto, ?string $messaggio): ReportInvio
    {
        $oggetto = trim((string) $oggetto) ?: self::oggettoPredefinito($doc, $ente);
        $messaggio = trim((string) $messaggio) ?: self::messaggioPredefinito($doc, $ente);
        $destinatari = array_values(array_unique(array_map('strtolower', array_map('trim', $destinatari))));

        $esito = 'ok'; $dettaglio = null; $conPdf = false;
        try {
            $html = self::html($doc, $ente);
            $pdf = self::pdf($html);
            $conPdf = $pdf !== null;
            // senza PDF il resoconto viaggia nel corpo del messaggio
            $inline = $conPdf ? null : (preg_match('~<body[^>]*>(.*)</body>~s', $html, $m) ? $m[1] : null);
            $corpo = view('report.email', ['messaggio' => $messaggio, 'inline' => $inline, 'ente' => $ente->name])->render();
            $file = self::nomeFile($doc);
            $mittente = $ente->email_mittente ?: config('mail.from.address');

            foreach ($destinatari as $a) {
                Mail::html($corpo, function ($m) use ($a, $oggetto, $mittente, $ente, $user, $pdf, $file) {
                    $m->to($a)->subject($oggetto)->from($mittente, $ente->name);
                    if ($user?->email) $m->replyTo($user->email, $user->name);
                    if ($pdf) $m->attachData($pdf, $file, ['mime' => 'application/pdf']);
                });
            }
            if (! $conPdf) $dettaglio = 'Libreria PDF non installata sul server: resoconto inviato nel corpo del messaggio.';
        } catch (Throwable $e) {
            report($e);
            $esito = 'errore';
            $dettaglio = mb_substr($e->getMessage(), 0, 500);
        }

        return ReportInvio::create([
            'institution_id' => $ente->id, 'user_id' => $user?->id, 'tipo' => $tipo, 'riferimento' => $riferimento,
            'destinatari' => $destinatari, 'nomi' => $doc['privacy']['nomi'], 'racconto' => $doc['privacy']['racconto'],
            'con_pdf' => $conPdf, 'esito' => $esito, 'dettaglio' => $dettaglio,
        ]);
    }
}
