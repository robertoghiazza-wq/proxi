<?php

namespace App\Support;

use App\Models\Evento;
use App\Models\Institution;
use App\Models\Persona;
use App\Models\TipoEvento;
use App\Models\TipoLuogo;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

// Costruisce i resoconti (settimanali o estratti di eventi) nel formato dei rapporti dell'équipe.
// Privacy: `nomi` = completi | iniziali | nessuno; `racconto` = includere o no il testo dell'evento;
// con nomi diversi da "completi" i luoghi riservati (case private…) compaiono solo col nome del tipo.
class ReportBuilder
{
    public const NOMI = ['completi', 'iniziali', 'nessuno'];

    public static function settimana(Institution $ente, int $anno, int $settimana, string $nomi = 'completi', bool $racconto = true): array
    {
        $lunedi = Carbon::now('Europe/Zurich')->setISODate($anno, $settimana)->startOfWeek();
        $domenica = $lunedi->copy()->endOfWeek();

        $eventi = self::query($ente)->where('stato', 'completato')
            ->whereBetween('data', [$lunedi->toDateString(), $domenica->toDateString()])->get();

        $doc = self::documento($ente, $eventi, "Resoconto settimanale {$settimana}/{$anno}", $nomi, $racconto);
        $doc['periodo'] = ['anno' => $anno, 'settimana' => $settimana, 'dal' => $lunedi->toDateString(), 'al' => $domenica->toDateString(),
            'etichetta' => self::etichettaPeriodo($lunedi, $domenica)];
        $doc['sottotitolo'] = $doc['periodo']['etichetta'];

        return $doc;
    }

    // Estratto di eventi scelti (anche uno solo)
    public static function estratto(Institution $ente, array $ids, string $nomi = 'completi', bool $racconto = true): array
    {
        $eventi = self::query($ente)->whereIn('id', $ids)->get();
        $titolo = $eventi->count() === 1 ? 'Estratto di un evento' : 'Estratto di eventi';
        $doc = self::documento($ente, $eventi, $titolo, $nomi, $racconto);
        if ($eventi->isNotEmpty()) {
            $dal = Carbon::parse($eventi->min(fn ($e) => $e->data->toDateString()));
            $al = Carbon::parse($eventi->max(fn ($e) => $e->data->toDateString()));
            $doc['sottotitolo'] = self::etichettaPeriodo($dal, $al);
        }

        return $doc;
    }

    public static function etichettaSettimana(Carbon $quando): string
    {
        return $quando->isoWeekYear.'-W'.str_pad((string) $quando->isoWeek, 2, '0', STR_PAD_LEFT);
    }

    private static function query(Institution $ente)
    {
        return Evento::forInstitution($ente->id)
            ->with(['luogo', 'persone', 'educatore:id,name', 'soste.luogo'])
            ->orderBy('data')->orderBy('ora_inizio')->orderBy('id');
    }

    private static function etichettaPeriodo(Carbon $dal, Carbon $al): string
    {
        $dal = $dal->copy()->locale('it'); $al = $al->copy()->locale('it');
        if ($dal->isSameDay($al)) return $dal->translatedFormat('j F Y');
        if ($dal->isSameMonth($al)) return $dal->translatedFormat('j').'–'.$al->translatedFormat('j F Y');

        return $dal->translatedFormat('j F').' – '.$al->translatedFormat('j F Y');
    }

    public static function documento(Institution $ente, Collection $eventi, string $titolo, string $nomi, bool $racconto): array
    {
        $nomi = in_array($nomi, self::NOMI, true) ? $nomi : 'completi';
        $nomiTipi = TipoEvento::where('institution_id', $ente->id)->pluck('nome', 'chiave');
        $nomiLuoghi = TipoLuogo::where('institution_id', $ente->id)->pluck('nome', 'chiave');

        $giorni = [];
        $oreTotali = 0;
        foreach ($eventi->groupBy(fn ($e) => $e->data->toDateString()) as $data => $delGiorno) {
            $righe = [];
            foreach ($delGiorno as $e) {
                $oreTotali += (int) $e->durata_min;
                $righe[] = self::riga($e, $nomi, $racconto, $nomiTipi, $nomiLuoghi);
            }
            $giorni[] = ['data' => $data, 'etichetta' => Carbon::parse($data)->locale('it')->translatedFormat('l, j F Y'), 'eventi' => $righe];
        }

        return [
            'titolo'      => $titolo,
            'sottotitolo' => null,
            'ente'        => ['nome' => $ente->name, 'motto' => $ente->motto, 'sito' => $ente->sito, 'logo' => self::logo($ente)],
            'privacy'     => ['nomi' => $nomi, 'racconto' => $racconto],
            'giorni'      => $giorni,
            'totali'      => ['eventi' => $eventi->count(), 'ore' => self::ore($oreTotali)],
        ];
    }

    private static function riga(Evento $e, string $nomi, bool $racconto, Collection $nomiTipi, Collection $nomiLuoghi): array
    {
        $inizio = $e->ora_inizio;
        $fine = $inizio && $e->durata_min ? Carbon::createFromFormat('H:i', $inizio)->addMinutes((int) $e->durata_min)->format('H:i') : null;

        // luoghi: le tappe se ci sono (con orario), altrimenti il luogo dell'evento
        $luoghi = [];
        $tappe = $e->soste->filter(fn ($s) => $s->luogo);
        if ($tappe->isNotEmpty()) {
            foreach ($tappe as $s) {
                $luoghi[] = ['nome' => self::nomeLuogo($s->luogo, $nomi, $nomiLuoghi), 'dalle' => $s->dalle, 'alle' => $s->alle];
            }
        } elseif ($e->luogo) {
            $luoghi[] = ['nome' => self::nomeLuogo($e->luogo, $nomi, $nomiLuoghi), 'dalle' => null, 'alle' => null];
        }

        $m = $f = $altro = $nd = 0;
        $elenco = [];
        foreach ($e->persone as $p) {
            match ($p->sesso) { 'M' => $m++, 'F' => $f++, 'altro' => $altro++, default => $nd++ };
            if ($n = self::nomePersona($p, $nomi)) $elenco[] = $n;
        }

        $tipoNome = $nomiTipi[$e->tipo] ?? ucfirst(str_replace('_', ' ', (string) $e->tipo));
        $ore = self::ore((int) $e->durata_min);
        $quando = $inizio ? 'Ore '.$inizio.($fine ? ' - '.$fine : '').' ('.$ore.' h)' : $ore.' h';
        $luoghiTesto = collect($luoghi)->map(fn ($l) => $l['nome'].($l['dalle'] && $l['alle'] ? " ({$l['dalle']} - {$l['alle']})" : ''))->implode(', ');
        $dettaglio = '';
        if ($e->persone->count() > 0) {
            $dettaglio = "({$m} M / {$f} F".($altro ? " / {$altro} altro" : '').($nd ? " / {$nd} n.d." : '').')'.($elenco ? ': '.implode(', ', $elenco) : '');
        }

        return [
            'testo'       => ['quando' => $quando, 'resto' => $tipoNome.($e->educatore ? " ({$e->educatore->name})" : ''), 'luoghi' => $luoghiTesto,
                              'presenti' => 'Persone presenti '.$e->persone->count(), 'presenti_dettaglio' => $dettaglio],
            'id'          => $e->id,
            'dalle'       => $inizio,
            'alle'        => $fine,
            'durata_ore'  => $ore,
            'tipo'        => $tipoNome,
            'educatore'   => $e->educatore?->name,
            'luoghi'      => $luoghi,
            'presenti'    => ['totale' => $e->persone->count(), 'm' => $m, 'f' => $f, 'altro' => $altro, 'nd' => $nd, 'nomi' => $elenco],
            'racconto'    => $racconto ? (trim((string) $e->note) ?: null) : null,
        ];
    }

    private static function nomeLuogo($luogo, string $nomi, Collection $nomiLuoghi): string
    {
        if ($luogo->visibilita === 'riservato' && $nomi !== 'completi') {
            return $nomiLuoghi[$luogo->tipo] ?? 'Luogo riservato';
        }

        return $luogo->nome;
    }

    private static function nomePersona(Persona $p, string $nomi): ?string
    {
        if ($nomi === 'nessuno') return null;
        if ($p->anonimo) return $p->soprannome ? "«{$p->soprannome}»" : null;
        $nome = trim("{$p->nome} {$p->cognome}");
        if ($nomi === 'iniziali') {
            $ini = collect([$p->nome, $p->cognome])->filter()->map(fn ($x) => mb_strtoupper(mb_substr($x, 0, 1)).'.')->implode(' ');

            return $ini ?: ($p->soprannome ?: null);
        }

        return trim($nome.($p->soprannome ? " ({$p->soprannome})" : '')) ?: null;
    }

    // 7.5 → "7.5"; 5 → "5" (come nei rapporti attuali)
    public static function ore(int $minuti): string
    {
        return rtrim(rtrim(number_format($minuti / 60, 1, '.', ''), '0'), '.') ?: '0';
    }

    // Logo dell'ente come data-URI (serve al PDF e all'e-mail)
    private static function logo(Institution $ente): ?string
    {
        $path = $ente->getAttributes()['logo_path'] ?? null;
        if (! $path || ! Storage::disk('local')->exists($path)) return null;
        $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) { 'svg' => 'image/svg+xml', 'png' => 'image/png', 'webp' => 'image/webp', default => 'image/jpeg' };

        return 'data:'.$mime.';base64,'.base64_encode(Storage::disk('local')->get($path));
    }
}
