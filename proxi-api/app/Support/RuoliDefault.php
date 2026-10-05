<?php

namespace App\Support;

use App\Models\Ruolo;

// Ruoli predefiniti per ente: [maschile, femminile (null = invariabile), forma mista per genere non noto]
class RuoliDefault
{
    public static function elenco(): array
    {
        return [
            ['Partecipante', null, null],
            ['Volontario', 'Volontaria', 'Volontario/a'],
            ['Educatore', 'Educatrice', 'Educatore/trice'],
            ['Stagiaire', null, null],
            ['Coordinatore progetto', 'Coordinatrice progetto', 'Coordinatore/trice progetto'],
            ['Coordinatore educativo', 'Coordinatrice educativa', 'Coordinatore/trice educativo/a'],
            ['Ricercatore', 'Ricercatrice', 'Ricercatore/trice'],
            ['Presidente', null, null],
            ['Membro comitato', null, null],
            ['Vicesindaco', 'Vicesindaca', 'Vicesindaco/a'],
            ['Assistente sociale', null, null],
            ['Agenzia AVS', null, null],
            ['Consulente salute sessuale', null, null],
            ['Consulente', null, null],
            ['Medico psichiatra', 'Medica psichiatra', 'Medico/a psichiatra'],
            ['Psicologo', 'Psicologa', 'Psicologo/a'],
            ['Psicoeducatore', 'Psicoeducatrice', 'Psicoeducatore/trice'],
            ['Animatore socio-culturale', 'Animatrice socio-culturale', 'Animatore/trice socio-culturale'],
            ['Docente', null, null],
            ['Docente DC', null, null],
            ['Docente SSP', null, null],
            ['Direttore', 'Direttrice', 'Direttore/trice'],
            ['Capo dicastero', null, null],
            ['Capo progetto', null, null],
            ['Case manager', null, null],
            ['Agente di polizia', null, null],
            ['Agente polizia di prossimità', null, null],
            ['Responsabile polizia di prossimità', null, null],
            ['Comandante di polizia', null, null],
            ['Esercente negozio', null, null],
            ['Esercente bar/ristorante', null, null],
            ['Autista', null, null],
            ['Operaio comunale', 'Operaia comunale', 'Operaio/a comunale'],
            ['Custode', null, null],
            ['Municipale', null, null],
            ['Magistrato', 'Magistrata', 'Magistrato/a'],
            ['Magistrato minorenni', 'Magistrata minorenni', 'Magistrato/a minorenni'],
            ['Avvocato', 'Avvocata', 'Avvocato/a'],
            ['Giudice', null, null],
            ['Referente UFaG', null, null],
            ['Mediatore', 'Mediatrice', 'Mediatore/trice'],
            ['Regista', null, null],
            ['Artista pittore', 'Artista pittrice', 'Artista pittore/trice'],
            ['Genitore', null, null],
            ['Genitore affidatario', 'Genitore affidataria', 'Genitore affidatario/a'],
            ['Parente', null, null],
            ['Datore di lavoro', 'Datrice di lavoro', 'Datore/trice di lavoro'],
            ['Dipendente', null, null],
            ['Responsabile Centro Velico', null, null],
            ['Vicesegretario', 'Vicesegretaria', 'Vicesegretario/a'],
            ['Altro', null, null],
        ];
    }

    public static function seed(int $institutionId): void
    {
        if (Ruolo::where('institution_id', $institutionId)->exists()) {
            return;
        }

        $now = now();
        $righe = [];
        foreach (self::elenco() as $i => [$m, $f, $misto]) {
            $righe[] = [
                'institution_id' => $institutionId, 'nome_m' => $m, 'nome_f' => $f, 'nome_misto' => $misto,
                'ordine' => ($i + 1) * 10, 'attivo' => true, 'created_at' => $now, 'updated_at' => $now,
            ];
        }
        Ruolo::insert($righe);
    }
}
