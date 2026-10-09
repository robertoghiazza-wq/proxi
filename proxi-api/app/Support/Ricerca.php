<?php

namespace App\Support;

use App\Models\Evento;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\PersonaDiario;
use App\Models\PersonaDocumento;
use App\Models\PersonaProfilo;
use App\Models\PersonaSostanza;
use App\Models\PersonaTelefono;
use App\Models\Ruolo;
use App\Models\Servizio;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Ricerca estesa, una per sezione: cerca ogni parola in tutti i campi di quella sezione e dei suoi dettagli (persone: diario, profilo,
// documenti, servizi; servizi: persone collegate). Solo gli eventi allargano ai luoghi e alle persone dell'evento. Restituisce, per ogni id, DOVE ha trovato la parola; più parole = devono esserci tutte (anche in campi diversi).
// I campi riservati (diario, profilo, note, documenti…) segnalano solo la sezione, mai il testo: aprendo la scheda si finisce nel log come sempre.
class Ricerca
{
    private const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    private const GIORNI = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
    private const STATI = ['completato' => 'svolto completato', 'pianificato' => 'pianificato', 'in_corso' => 'in corso'];

    // [id => [['campo' => 'Diario', 'estratto' => ?string], …]]
    public static function esegui(int $inst, string $ambito, string $testo): array
    {
        $termini = array_slice(array_values(array_unique(array_filter(
            preg_split('/\s+/u', mb_strtolower(trim($testo))) ?: [], fn ($t) => mb_strlen($t) >= 2))), 0, 6);
        if (! $termini) return [];

        $totale = null;
        foreach ($termini as $t) {
            $trovati = match ($ambito) {
                'persone' => self::persone($inst, $t),
                'luoghi'  => self::luoghi($inst, $t),
                'eventi'  => self::eventi($inst, $t),
                'servizi' => self::servizi($inst, $t),
                default   => [],
            };
            if ($totale === null) {
                $totale = $trovati;
            } else {
                $totale = array_intersect_key($totale, $trovati);
                foreach ($totale as $id => $hit) $totale[$id] = self::unisci($hit, $trovati[$id]);
            }
            if (! $totale) return [];
        }

        return array_map(fn ($hit) => array_slice($hit, 0, 5), $totale ?? []);
    }

    // ---------- persone ----------
    private static function persone(int $inst, string $t): array
    {
        $n = self::norm($t);
        $out = [];

        $righe = Persona::forInstitution($inst)->get(['id', 'ruolo_id', 'nome', 'cognome', 'soprannome', 'indirizzo', 'npa', 'localita', 'comune_politico',
            'paese', 'note_contatti', 'telefono', 'email', 'tag', 'bisogni', 'lingue', 'note']);
        $ruoli = Ruolo::where('institution_id', $inst)->get()->mapWithKeys(fn ($r) => [$r->id => [$r->nome_m, $r->nome_f, $r->nome_misto]]);
        foreach ($righe as $p) {
            self::campo($out, $p->id, 'Nome', [$p->nome, $p->cognome, $p->soprannome], $n);
            self::campo($out, $p->id, 'Contatti', [$p->indirizzo, $p->npa, $p->localita, $p->comune_politico, $p->paese, $p->note_contatti, $p->telefono, $p->email], $n);
            self::campo($out, $p->id, 'Tag', (array) $p->tag, $n);
            self::campo($out, $p->id, 'Lingue', (array) $p->lingue, $n);
            self::campo($out, $p->id, 'Ruolo', self::da($ruoli, $p->ruolo_id) ?? [], $n);
            self::campo($out, $p->id, 'Note e bisogni', [$p->note, ...(array) $p->bisogni], $n, riservato: true);
        }
        $ids = $righe->pluck('id')->all();

        foreach (PersonaTelefono::whereIn('persona_id', $ids)->get(['persona_id', 'etichetta', 'numero']) as $r) {
            self::campo($out, $r->persona_id, 'Contatti', [$r->etichetta, $r->numero], $n);
        }
        foreach (self::sql(PersonaProfilo::where('institution_id', $inst), PersonaProfilo::CAMPI, $t)->pluck('persona_id') as $id) self::aggiungi($out, $id, 'Profilo');
        foreach (self::sql(PersonaSostanza::whereIn('persona_id', $ids), ['sostanza', 'con_chi', 'frequenza', 'note'], $t)->pluck('persona_id') as $id) self::aggiungi($out, $id, 'Profilo');
        foreach (self::sql(PersonaDiario::where('institution_id', $inst), ['nota'], $t)->pluck('persona_id') as $id) self::aggiungi($out, $id, 'Diario');
        foreach (self::sql(PersonaDocumento::where('institution_id', $inst), ['titolo', 'note', 'nome_originale', 'tipo'], $t)->pluck('persona_id') as $id) self::aggiungi($out, $id, 'Documenti');

        // servizi a cui la persona è collegata (nome del servizio o ruolo che ha lì)
        $servizi = Servizio::where('institution_id', $inst)->pluck('nome', 'id');
        foreach (DB::table('persona_servizio')->whereIn('servizio_id', $servizi->keys())->get() as $r) {
            self::campo($out, $r->persona_id, 'Servizio', [$servizi[$r->servizio_id], $r->ruolo], $n);
        }

        return $out;
    }

    // ---------- luoghi ----------
    private static function luoghi(int $inst, string $t): array
    {
        $n = self::norm($t);
        $out = [];
        $tipi = DB::table('tipi_luogo')->where('institution_id', $inst)->pluck('nome', 'chiave');
        $servizi = Servizio::where('institution_id', $inst)->pluck('nome', 'id');

        $righe = Luogo::forInstitution($inst)->attivi()->get(['id', 'nome', 'tipo', 'indirizzo', 'npa', 'localita', 'comune_politico', 'cantone',
            'punto_esatto', 'orari', 'note', 'servizio_id', 'visibilita']);
        foreach ($righe as $l) {
            self::campo($out, $l->id, 'Nome', [$l->nome], $n);
            self::campo($out, $l->id, 'Indirizzo', [$l->indirizzo, $l->npa, $l->localita, $l->comune_politico, $l->cantone, $l->punto_esatto], $n);
            self::campo($out, $l->id, 'Orari', [$l->orari], $n);
            self::campo($out, $l->id, 'Note', [$l->note], $n);
            self::campo($out, $l->id, 'Tipo', [self::da($tipi, $l->tipo), $l->visibilita === 'riservato' ? 'riservato' : 'pubblico'], $n);
            self::campo($out, $l->id, 'Ente di riferimento', [self::da($servizi, $l->servizio_id)], $n);
        }
        return array_intersect_key($out, array_flip($righe->pluck('id')->all()));
    }

    // ---------- eventi ----------
    private static function eventi(int $inst, string $t): array
    {
        $n = self::norm($t);
        $out = [];
        $tipi = DB::table('tipi_evento')->where('institution_id', $inst)->pluck('nome', 'chiave');
        $educatori = User::where('institution_id', $inst)->pluck('name', 'id');

        $righe = Evento::forInstitution($inst)->get(['id', 'tipo', 'data', 'note', 'stato', 'educatore_id', 'luogo_id']);
        foreach ($righe as $e) {
            self::campo($out, $e->id, 'Tipo', [self::da($tipi, $e->tipo) ?? $e->tipo], $n);
            self::campo($out, $e->id, 'Note', [$e->note], $n);
            self::campo($out, $e->id, 'Stato', [self::STATI[$e->stato] ?? $e->stato], $n);
            self::campo($out, $e->id, 'Educatore', [self::da($educatori, $e->educatore_id)], $n);
            if (self::dataCorrisponde($e->data?->format('Y-m-d'), $n)) self::aggiungi($out, $e->id, 'Data');
        }

        $luoghi = self::luoghiCorrispondenti($inst, $n);
        foreach ($righe as $e) if ($e->luogo_id !== null && isset($luoghi[$e->luogo_id])) self::aggiungi($out, $e->id, 'Luogo', $luoghi[$e->luogo_id]);
        if (Schema::hasTable('evento_soste') && $luoghi) {
            foreach (DB::table('evento_soste')->whereIn('luogo_id', array_keys($luoghi))->get(['evento_id', 'luogo_id']) as $s) {
                self::aggiungi($out, $s->evento_id, 'Tappe', $luoghi[$s->luogo_id]);
            }
        }

        $persone = Persona::forInstitution($inst)->get(['id', 'nome', 'cognome', 'soprannome']);
        $trovate = [];
        foreach ($persone as $p) {
            if (self::trova([$p->nome, $p->cognome, $p->soprannome], $n)) $trovate[$p->id] = trim("{$p->nome} {$p->cognome}") ?: $p->soprannome;
        }
        if ($trovate) {
            foreach (DB::table('evento_persona')->whereIn('persona_id', array_keys($trovate))->get() as $r) {
                self::aggiungi($out, $r->evento_id, 'Persone', $trovate[$r->persona_id]);
            }
        }

        return array_intersect_key($out, array_flip($righe->pluck('id')->all()));
    }

    // ---------- servizi ----------
    private static function servizi(int $inst, string $t): array
    {
        $n = self::norm($t);
        $out = [];
        $righe = Servizio::where('institution_id', $inst)->get(['id', 'nome', 'indirizzo', 'cap', 'localita', 'paese', 'telefono', 'email', 'sito', 'note', 'comune_politico']);
        foreach ($righe as $s) {
            self::campo($out, $s->id, 'Nome', [$s->nome], $n);
            self::campo($out, $s->id, 'Indirizzo', [$s->indirizzo, $s->cap, $s->localita, $s->paese, $s->comune_politico], $n);
            self::campo($out, $s->id, 'Contatti', [$s->telefono, $s->email, $s->sito], $n);
            self::campo($out, $s->id, 'Note', [$s->note], $n);
        }

        $persone = Persona::forInstitution($inst)->get(['id', 'nome', 'cognome', 'soprannome'])->keyBy('id');
        foreach (DB::table('persona_servizio')->whereIn('servizio_id', $righe->pluck('id'))->get() as $r) {
            $p = $persone[$r->persona_id] ?? null;
            if ($p) self::campo($out, $r->servizio_id, 'Persone', [$p->nome, $p->cognome, $p->soprannome, $r->ruolo], $n);
        }
        return $out;
    }

    // ---------- strumenti ----------
    // luoghi (attivi) in cui compare la parola: id => nome
    private static function luoghiCorrispondenti(int $inst, string $n): array
    {
        $trovati = [];
        foreach (Luogo::forInstitution($inst)->get(['id', 'nome', 'indirizzo', 'npa', 'localita', 'comune_politico', 'punto_esatto']) as $l) {
            if (self::trova([$l->nome, $l->indirizzo, $l->npa, $l->localita, $l->comune_politico, $l->punto_esatto], $n)) $trovati[$l->id] = $l->nome;
        }

        return $trovati;
    }

    // Aggiunge un risultato se uno dei valori contiene la parola (senza maiuscole né accenti). Se riservato: niente testo, solo la sezione.
    private static function campo(array &$out, $id, string $campo, array $valori, string $n, bool $riservato = false): void
    {
        foreach ($valori as $v) {
            if (is_array($v)) $v = implode(' ', $v);
            $v = (string) $v;
            if ($v !== '' && str_contains(self::norm($v), $n)) {
                self::aggiungi($out, $id, $campo, $riservato ? null : self::estratto($v, $n));

                return;
            }
        }
    }

    // valore di una mappa (anche Collection) senza inciampare nelle chiavi nulle
    private static function da($mappa, $chiave)
    {
        return $chiave === null ? null : ($mappa[$chiave] ?? null);
    }

    private static function trova(array $valori, string $n): bool
    {
        foreach ($valori as $v) if ($v !== null && $v !== '' && str_contains(self::norm((string) $v), $n)) return true;

        return false;
    }

    private static function aggiungi(array &$out, $id, string $campo, ?string $estratto = null): void
    {
        if ($id === null) return;
        foreach ($out[$id] ?? [] as $h) if ($h['campo'] === $campo) return;
        $out[$id][] = ['campo' => $campo, 'estratto' => $estratto];
    }

    private static function unisci(array $a, array $b): array
    {
        foreach ($b as $h) {
            if (! collect($a)->contains('campo', $h['campo'])) $a[] = $h;
        }

        return $a;
    }

    // Colonne di testo lunghe: LIKE nel database (il confronto senza accenti lo fa il database stesso)
    private static function sql($query, array $campi, string $t)
    {
        $like = '%'.addcslashes($t, '%_\\').'%';

        return $query->where(function ($w) use ($campi, $like) {
            foreach ($campi as $c) $w->orWhere($c, 'like', $like);
        });
    }

    // «…un po' di testo attorno alla parola…»
    private static function estratto(string $v, string $n): string
    {
        $v = trim(preg_replace('/\s+/u', ' ', $v));
        $pos = mb_strpos(self::norm($v), $n);
        if ($pos === false || mb_strlen($v) <= 60) return mb_substr($v, 0, 60);
        $da = max(0, $pos - 20);

        return ($da > 0 ? '…' : '').mb_substr($v, $da, 60).($da + 60 < mb_strlen($v) ? '…' : '');
    }

    private static function norm(?string $s): string
    {
        return strtr(mb_strtolower((string) $s), [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ä' => 'a', 'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n',
        ]);
    }

    // Date: 5.10.2026, 5/10, 2026-10, 2026, «ottobre», «lunedì»
    private static function dataCorrisponde(?string $iso, string $n): bool
    {
        if (! $iso) return false;
        [$y, $m, $d] = array_map('intval', explode('-', $iso));
        $ts = mktime(0, 0, 0, $m, $d, $y);

        if (preg_match('/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?$/', $n, $x)) {
            $anno = isset($x[3]) ? (int) $x[3] + (strlen($x[3]) === 2 ? 2000 : 0) : null;

            return (int) $x[1] === $d && (int) $x[2] === $m && ($anno === null || $anno === $y);
        }
        if (preg_match('/^\d{4}-\d{1,2}(-\d{1,2})?$/', $n)) return str_starts_with($iso, $n) || str_starts_with($iso, preg_replace('/-(\d)(?!\d)/', '-0$1', $n));
        if (preg_match('/^\d{4}$/', $n)) return (int) $n === $y;
        if (mb_strlen($n) >= 3) {
            $mese = self::MESI[$m - 1];
            $giorno = self::GIORNI[((int) date('N', $ts)) - 1];

            return str_starts_with($mese, $n) || str_starts_with($giorno, $n);
        }

        return false;
    }
}
