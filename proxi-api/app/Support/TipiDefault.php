<?php

namespace App\Support;

use App\Models\CategoriaEvento;
use App\Models\TipoEvento;
use App\Models\TipoLuogo;

// Colori selezionabili per categorie e tipi (chiave => tonalità oklch). Il frontend usa le stesse tonalità.
// Valori di partenza: i tipi e le categorie del design handoff, modificabili da coordinatori e admin.
class TipiDefault
{
    public const PALETTE = [
        'rosso' => 25, 'arancio' => 40, 'giallo' => 80, 'lime' => 125, 'verde' => 160,
        'azzurro' => 200, 'blu' => 250, 'viola' => 280, 'rosa' => 340, 'grigio' => null,
    ];

    // categoria => [nome, colore, tipi[chiave => nome]]
    public static function eventi(): array
    {
        return [
            'territorio' => ['Sul territorio', 'arancio', [
                'uscita' => 'Uscita sul territorio', 'mappatura' => 'Mappatura', 'contatti' => 'Contatti',
                'incontro_individuale' => 'Incontro individuale', 'accompagnamento' => 'Accompagnamento individuale',
            ]],
            'riunioni' => ['Riunioni', 'azzurro', [
                'riunione_rete' => 'Riunione di rete', 'riunione_equipe' => 'Riunione équipe', 'riunione_ist' => 'Riunione istituzionale',
                'incontro_esterno' => 'Incontro esterno', 'presentazione' => 'Presentazione progetto',
            ]],
            'interno' => ['Lavoro interno', 'verde', [
                'coordinamento' => 'Coordinamento', 'progettazione' => 'Progettazione', 'ricerca' => 'Attività di ricerca',
                'manutenzione' => 'Manutenzione veicolo', 'acquisti' => 'Acquisti', 'lavoro_generico' => 'Lavoro generico',
                'inserimento_dati' => 'Inserimento dati',
            ]],
            'sviluppo' => ['Sviluppo prof.', 'viola', [
                'lavoro_individuale' => 'Lavoro individuale', 'formazione' => 'Formazione', 'supervisione' => 'Supervisione',
            ]],
            'assenze' => ['Assenze', 'giallo', [
                'recupero_ore' => 'Recupero ore', 'vacanze' => 'Vacanze',
            ]],
        ];
    }

    // Il luogo è il punto di riferimento (Lidl, scuola, centro giovani), anche se ci si ferma nel suo parcheggio:
    // chiave => [nome, colore, riservato di default]
    public static function luoghi(): array
    {
        return [
            'parchi_piazze_sport'      => ['Parchi, piazze e sport', 'verde', false],
            'scuole_formazione'        => ['Scuole e formazione', 'blu', false],
            'centri_giovani'           => ['Centri giovani e spazi aggregativi', 'arancio', false],
            'commerci_ristorazione'    => ['Commerci e ristorazione', 'giallo', false],
            'stazioni_trasporti'       => ['Stazioni e trasporti', 'azzurro', false],
            'strutture_pubbliche'      => ['Strutture pubbliche e comunità', 'grigio', false],
            'servizi_sociosanitari'    => ['Servizi sociali e sanitari', 'rosso', false],
            'aziende_officine'         => ['Aziende e officine', 'lime', false],
            'abitazioni_private'       => ['Abitazioni private', 'rosa', true],
            'sedi_associazione'        => ['Sedi dell\'associazione', 'viola', false],
            'zone_comuni'              => ['Zone e comuni', 'azzurro', false],
            'strade_senza_riferimento' => ['Strade, parcheggi e aree senza altro riferimento', 'grigio', false],
        ];
    }

    // I cinque tipi di partenza della prima versione: sostituiti dai precedenti
    public const TIPI_LUOGO_VECCHI = ['strada', 'informale', 'diurno', 'sanitario', 'ufficio'];

    // Per gli enti già esistenti: aggiunge i nuovi tipi di luogo; i cinque vecchi spariscono se non usati, altrimenti si disattivano
    public static function aggiornaTipiLuogo(int $institutionId): void
    {
        $o = (int) TipoLuogo::where('institution_id', $institutionId)->max('ordine') + 1;
        foreach (self::luoghi() as $chiave => [$nome, $colore, $riservato]) {
            if (! TipoLuogo::where('institution_id', $institutionId)->where('chiave', $chiave)->exists()) {
                TipoLuogo::create(self::datiTipoLuogo($institutionId, $chiave, $nome, $colore, $riservato, $o++));
            }
        }
        foreach (TipoLuogo::where('institution_id', $institutionId)->whereIn('chiave', self::TIPI_LUOGO_VECCHI)->get() as $vecchio) {
            if (\App\Models\Luogo::withTrashed()->where('institution_id', $institutionId)->where('tipo', $vecchio->chiave)->exists()) {
                $vecchio->update(['attivo' => false]);
            } else {
                $vecchio->delete();
            }
        }
    }

    // La colonna riservato_default arriva con una migrazione successiva: finché non c'è, non si scrive
    private static function datiTipoLuogo(int $institutionId, string $chiave, string $nome, string $colore, bool $riservato, int $ordine): array
    {
        return ['institution_id' => $institutionId, 'chiave' => $chiave, 'nome' => $nome, 'colore' => $colore, 'ordine' => $ordine]
            + (\Illuminate\Support\Facades\Schema::hasColumn('tipi_luogo', 'riservato_default') ? ['riservato_default' => $riservato] : []);
    }

    public static function seed(int $institutionId): void
    {
        if (! CategoriaEvento::where('institution_id', $institutionId)->exists()) {
            $o = 0;
            foreach (self::eventi() as [$nome, $colore, $tipi]) {
                $cat = CategoriaEvento::create(['institution_id' => $institutionId, 'nome' => $nome, 'colore' => $colore, 'ordine' => $o++]);
                $t = 0;
                foreach ($tipi as $chiave => $tn) {
                    TipoEvento::create(['institution_id' => $institutionId, 'categoria_id' => $cat->id, 'chiave' => $chiave, 'nome' => $tn, 'ordine' => $t++]);
                }
            }
        }

        if (! TipoLuogo::where('institution_id', $institutionId)->exists()) {
            $o = 0;
            foreach (self::luoghi() as $chiave => [$nome, $colore, $riservato]) {
                TipoLuogo::create(self::datiTipoLuogo($institutionId, $chiave, $nome, $colore, $riservato, $o++));
            }
        }
    }
}
