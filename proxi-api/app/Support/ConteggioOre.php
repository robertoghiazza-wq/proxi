<?php

namespace App\Support;

use App\Models\Evento;
use App\Models\OreMensile;
use App\Models\Persona;
use App\Models\PersonaContratto;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

// Conteggio ore di un dipendente.
//  • Le settimane (lunedì–domenica) appartengono al mese in cui cade il loro giovedì (regola ISO): ogni settimana è in un solo mese.
//  • Ore dovute = ore settimanali del contratto in vigore × settimane del mese (se mancano, grado % × ore a tempo pieno).
//  • Ore lavorate = eventi svolti di cui la persona è l'educatore (via account) o una delle persone coinvolte; le ore sono
//    quelle effettive degli eventi.
//  • Saldo = lavorate + ore di vacanza + ore di festivi − dovute + correzione.
class ConteggioOre
{
    private Collection $contratti;
    private ?int $userId;

    public function __construct(private Persona $persona)
    {
        $this->contratti = PersonaContratto::where('persona_id', $persona->id)->orderByDesc('data_inizio')->get();
        $this->userId = User::where('persona_id', $persona->id)->value('id');
    }

    /** @return CarbonImmutable[] i lunedì delle settimane del mese */
    public static function lunedi(int $anno, int $mese): array
    {
        $primo = CarbonImmutable::create($anno, $mese, 1);
        $lun = $primo->startOfWeek()->subWeek();
        $out = [];
        for ($i = 0; $i < 8; $i++) {
            $giovedi = $lun->addDays(3);
            if ($giovedi->year === $anno && $giovedi->month === $mese) {
                $out[] = $lun;
            }
            $lun = $lun->addWeek();
        }

        return $out;
    }

    public function oreSettimanali(CarbonImmutable $giorno): ?float
    {
        $c = $this->contratti->first(fn (PersonaContratto $c) => $c->data_inizio->lte($giorno) && ($c->data_fine === null || $c->data_fine->gte($giorno)));
        if (! $c) {
            return null;
        }
        if ($c->ore_settimanali !== null) {
            return (float) $c->ore_settimanali;
        }

        return $c->grado !== null ? round((float) $c->grado * config('proxi.ore_tempo_pieno', 40) / 100, 2) : null;
    }

    public function mese(int $anno, int $mese, bool $conEventi = true): array
    {
        $voce = OreMensile::where('persona_id', $this->persona->id)->where('anno', $anno)->where('mese', $mese)->first();
        $settimane = [];
        $contrattoMancante = false;
        $dovute = 0.0;
        $lavorate = 0.0;
        $oreSettimanaliMese = null;

        foreach (self::lunedi($anno, $mese) as $lun) {
            $dom = $lun->addDays(6);
            $os = $this->oreSettimanali($lun->addDays(3));
            if ($os === null) {
                $contrattoMancante = true;
            }
            $oreSettimanaliMese ??= $os;

            $eventi = $this->eventi($lun, $dom);
            $min = $eventi->sum('durata_min');
            $settimane[] = [
                'iso' => (int) $lun->isoWeek(),
                'dal' => $lun->toDateString(),
                'al' => $dom->toDateString(),
                'ore_dovute' => round($os ?? 0, 2),
                'ore_lavorate' => round($min / 60, 2),
                'eventi' => $conEventi ? $eventi->map(fn (Evento $e) => [
                    'id' => $e->id, 'data' => $e->data->toDateString(), 'ora_inizio' => $e->ora_inizio, 'tipo' => $e->tipo,
                    'durata_min' => $e->durata_min, 'luogo' => $e->luogo?->nome,
                ])->values()->all() : [],
            ];
            $dovute += $os ?? 0;
            $lavorate += $min / 60;
        }

        $giornoOre = ($oreSettimanaliMese ?? 0) / 5;
        $vacGiorni = (float) ($voce?->vacanze_giorni ?? 0);
        $fesGiorni = (float) ($voce?->festivi_giorni ?? 0);
        $corr = (float) ($voce?->correzione_ore ?? 0);
        $vacOre = round($vacGiorni * $giornoOre, 2);
        $fesOre = round($fesGiorni * $giornoOre, 2);

        return [
            'anno' => $anno,
            'mese' => $mese,
            'contratto_mancante' => $contrattoMancante,
            'ore_giornaliere' => round($giornoOre, 2),
            'settimane' => $settimane,
            'voce' => ['vacanze_giorni' => $vacGiorni, 'festivi_giorni' => $fesGiorni, 'correzione_ore' => $corr, 'nota' => $voce?->nota],
            'totali' => [
                'dovute' => round($dovute, 2),
                'lavorate' => round($lavorate, 2),
                'vacanze_ore' => $vacOre,
                'festivi_ore' => $fesOre,
                'correzione' => round($corr, 2),
                'saldo' => round($lavorate + $vacOre + $fesOre - $dovute + $corr, 2),
            ],
        ];
    }

    public function anno(int $anno): array
    {
        $mesi = [];
        $saldo = 0.0;
        foreach (range(1, 12) as $m) {
            $r = $this->mese($anno, $m, false);
            $saldo += $r['totali']['saldo'];
            $mesi[] = ['mese' => $m, 'contratto_mancante' => $r['contratto_mancante'], 'voce' => $r['voce'], 'totali' => $r['totali']];
        }

        return ['anno' => $anno, 'mesi' => $mesi, 'saldo_annuo' => round($saldo, 2)];
    }

    private function eventi(CarbonImmutable $dal, CarbonImmutable $al): Collection
    {
        $id = $this->persona->id;
        $userId = $this->userId;

        return Evento::forInstitution($this->persona->institution_id)
            ->where('stato', 'completato')
            ->whereBetween('data', [$dal->toDateString(), $al->toDateString()])
            ->where(function ($q) use ($id, $userId) {
                $q->whereHas('persone', fn ($p) => $p->where('persone.id', $id));
                if ($userId) {
                    $q->orWhere('educatore_id', $userId);
                }
            })
            ->with('luogo:id,nome')
            ->orderBy('data')->orderBy('ora_inizio')
            ->get();
    }
}
