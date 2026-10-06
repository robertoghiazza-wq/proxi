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

    public static function luoghi(): array
    {
        return [
            'strada'    => ['Strada / piazza', 'arancio'],
            'informale' => ["Punto d'incontro", 'giallo'],
            'diurno'    => ['Centro diurno', 'verde'],
            'sanitario' => ['Servizio sanitario', 'azzurro'],
            'ufficio'   => ['Ufficio / sede', 'viola'],
        ];
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
            foreach (self::luoghi() as $chiave => [$nome, $colore]) {
                TipoLuogo::create(['institution_id' => $institutionId, 'chiave' => $chiave, 'nome' => $nome, 'colore' => $colore, 'ordine' => $o++]);
            }
        }
    }
}
