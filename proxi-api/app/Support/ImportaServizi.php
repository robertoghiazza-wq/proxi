<?php

namespace App\Support;

use App\Models\Servizio;
use App\Models\ServizioOrigine;
use Illuminate\Support\Facades\DB;

// Importazione dei servizi da un CSV pulito (database/data/servizi_iniziali.csv).
// Colonne: id_filemaker, id_unificati, nome, alias, indirizzo, cap, localita, paese, telefono, email, sito, note, lat, lng,
// comune_politico, bfs, cantone. «alias» = nomi con cui il servizio è già stato creato dall'importazione dei luoghi (separati da |).
// Ripetibile: un servizio già importato (stesso id di FileMaker) non si tocca, così non si perdono le modifiche fatte a mano.
class ImportaServizi
{
    public static function applica(int $inst, array $righe): array
    {
        return DB::transaction(function () use ($inst, $righe) {
            $mappa = [];
            foreach ($righe as $r) {
                $idfm = trim($r['id_filemaker']);
                $altri = array_filter(array_map('trim', explode('|', (string) ($r['id_unificati'] ?? ''))));

                $id = ServizioOrigine::where('institution_id', $inst)->where('id_origine', $idfm)->value('servizio_id');
                $servizio = $id ? Servizio::where('institution_id', $inst)->withTrashed()->find($id) : null;

                if (! $servizio) {
                    // già creato dall'importazione dei luoghi (con il nome dell'«ente di riferimento»)?
                    $nomi = array_map([ImportaLuoghi::class, 'chiave'], [$r['nome'], ...array_filter(explode('|', (string) ($r['alias'] ?? '')))]);
                    $servizio = Servizio::where('institution_id', $inst)->withTrashed()->get()
                        ->first(fn ($s) => in_array(ImportaLuoghi::chiave($s->nome), $nomi, true));
                    if ($servizio) {
                        if ($servizio->trashed()) $servizio->restore();
                        $servizio->update(self::dati($r));
                    } else {
                        $servizio = Servizio::create(self::dati($r) + ['institution_id' => $inst]);
                    }
                }

                foreach (array_unique([$idfm, ...$altri]) as $origine) {
                    ServizioOrigine::updateOrCreate(['institution_id' => $inst, 'id_origine' => $origine], ['servizio_id' => $servizio->id]);
                }
                $mappa[] = ['id_origine' => $idfm, 'id_proxi' => $servizio->id, 'nome' => $servizio->nome];
            }

            return $mappa;
        });
    }

    private static function dati(array $r): array
    {
        $n = [ImportaLuoghi::class, 'nullo'];

        return [
            'nome' => trim($r['nome']), 'indirizzo' => $n($r['indirizzo'] ?? null), 'cap' => $n($r['cap'] ?? null), 'localita' => $n($r['localita'] ?? null),
            'paese' => $n($r['paese'] ?? null) ?? 'Svizzera', 'telefono' => $n($r['telefono'] ?? null), 'email' => $n($r['email'] ?? null),
            'sito' => $n($r['sito'] ?? null), 'note' => $n($r['note'] ?? null),
            'lat' => ($r['lat'] ?? '') !== '' ? round((float) $r['lat'], 7) : null, 'lng' => ($r['lng'] ?? '') !== '' ? round((float) $r['lng'], 7) : null,
            'comune_politico' => $n($r['comune_politico'] ?? null), 'bfs' => $n($r['bfs'] ?? null), 'cantone' => $n($r['cantone'] ?? null),
            'attivo' => true,
        ];
    }
}
