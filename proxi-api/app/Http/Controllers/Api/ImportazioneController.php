<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Luogo;
use App\Models\LuogoOrigine;
use App\Models\Servizio;
use App\Models\TipoLuogo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Importazione dei luoghi da un CSV pulito (colonne: id_filemaker, nome, tipo, visibilita, punto_esatto, indirizzo, npa, localita, nazione,
// lat, lng, geo_qualita, comune_politico, bfs, cantone, orari, note, ente_riferimento, id_origine_unificati). Solo admin.
// Senza `conferma` mostra solo cosa succederebbe. L'importazione si può ripetere: i luoghi già importati (stesso id di FileMaker) si aggiornano.
class ImportazioneController extends Controller
{
    public function luoghi(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Solo un admin può importare dati.');
        $request->validate([
            'file'        => 'required|file|max:4096|mimes:csv,txt',
            'conferma'    => 'sometimes|boolean',
            'sostituisci' => 'sometimes|boolean',
        ], ['file.required' => 'Scegli il file CSV dei luoghi.', 'file.mimes' => 'Il file deve essere un CSV.']);

        $inst = $request->user()->institution_id;
        $righe = $this->leggi($request->file('file')->getRealPath());
        abort_if(empty($righe), 422, 'Il file è vuoto.');
        abort_unless(isset($righe[0]['nome'], $righe[0]['tipo'], $righe[0]['id_filemaker']), 422, 'Mancano le colonne id_filemaker, nome e tipo: serve il file luoghi_puliti.csv.');

        $tipi = TipoLuogo::where('institution_id', $inst)->pluck('chiave')->all();
        $errori = [];
        foreach ($righe as $i => $r) {
            $n = $i + 2;
            if (trim($r['nome']) === '') $errori[] = "Riga {$n}: manca il nome.";
            if (! in_array($r['tipo'], $tipi, true)) $errori[] = "Riga {$n} ({$r['nome']}): il tipo «{$r['tipo']}» non esiste nelle impostazioni.";
            if (! in_array($r['visibilita'] ?? 'pubblico', ['pubblico', 'riservato'], true)) $errori[] = "Riga {$n} ({$r['nome']}): visibilità non valida.";
            foreach (['lat', 'lng'] as $c) if (($r[$c] ?? '') !== '' && ! is_numeric($r[$c])) $errori[] = "Riga {$n} ({$r['nome']}): {$c} non è un numero.";
        }

        $esistenti = LuogoOrigine::where('institution_id', $inst)->pluck('luogo_id', 'id_origine');
        $nuovi = collect($righe)->filter(fn ($r) => ! isset($esistenti[$r['id_filemaker']]))->count();

        $serviziEsistenti = Servizio::where('institution_id', $inst)->pluck('id', 'nome')->mapWithKeys(fn ($id, $nome) => [$this->chiave($nome) => $id]);
        $serviziNuovi = collect($righe)->pluck('ente_riferimento')->map(fn ($e) => trim((string) $e))->filter()->unique()
            ->reject(fn ($e) => isset($serviziEsistenti[$this->chiave($e)]))->values()->all();

        $daArchiviare = [];
        if ($request->boolean('sostituisci')) {
            $daArchiviare = Luogo::forInstitution($inst)->whereDoesntHave('origini')->withCount('eventi')->get()
                ->map(fn ($l) => ['id' => $l->id, 'nome' => $l->nome, 'eventi' => $l->eventi_count])->all();
        }

        $esito = [
            'applicato'      => false,
            'righe'          => count($righe),
            'nuovi'          => $nuovi,
            'aggiornati'     => count($righe) - $nuovi,
            'servizi_nuovi'  => $serviziNuovi,
            'da_archiviare'  => $daArchiviare,
            'da_controllare' => collect($righe)->filter(fn ($r) => $this->daControllare($r))->count(),
            'errori'         => $errori,
        ];
        if (! $request->boolean('conferma') || $errori) {
            return response()->json($esito);
        }

        $mappa = DB::transaction(function () use ($righe, $inst, $request, $daArchiviare) {
            $mappa = [];
            $servizi = Servizio::where('institution_id', $inst)->get()->mapWithKeys(fn ($s) => [$this->chiave($s->nome) => $s->id]);
            foreach ($righe as $r) {
                $ente = trim((string) ($r['ente_riferimento'] ?? ''));
                $servizioId = null;
                if ($ente !== '') {
                    $k = $this->chiave($ente);
                    $servizi[$k] ??= Servizio::create(['institution_id' => $inst, 'nome' => $ente, 'note' => 'Creato dall\'importazione dei luoghi.'])->id;
                    $servizioId = $servizi[$k];
                }
                $nota = trim((string) ($r['note'] ?? ''));
                if (($r['nazione'] ?? 'Svizzera') !== 'Svizzera') $nota = trim($nota.' Si trova in '.$r['nazione'].'.');

                $dati = [
                    'nome' => trim($r['nome']), 'tipo' => $r['tipo'], 'visibilita' => $r['visibilita'] ?: 'pubblico',
                    'punto_esatto' => $this->nullo($r['punto_esatto'] ?? null), 'indirizzo' => $this->nullo($r['indirizzo'] ?? null),
                    'npa' => $this->nullo($r['npa'] ?? null), 'localita' => $this->nullo($r['localita'] ?? null),
                    'comune_politico' => $this->nullo($r['comune_politico'] ?? null), 'bfs' => $this->nullo($r['bfs'] ?? null), 'cantone' => $this->nullo($r['cantone'] ?? null),
                    'lat' => ($r['lat'] ?? '') !== '' ? round((float) $r['lat'], 7) : null, 'lng' => ($r['lng'] ?? '') !== '' ? round((float) $r['lng'], 7) : null,
                    'orari' => $this->nullo($r['orari'] ?? null), 'note' => $nota ?: null,
                    'servizio_id' => $servizioId, 'posizione_da_controllare' => $this->daControllare($r), 'attivo' => true,
                ];

                $id = LuogoOrigine::where('institution_id', $inst)->where('id_origine', $r['id_filemaker'])->value('luogo_id');
                $luogo = $id ? Luogo::forInstitution($inst)->withTrashed()->find($id) : null;
                if ($luogo) {
                    if ($luogo->trashed()) $luogo->restore();
                    $luogo->update($dati);
                } else {
                    $luogo = Luogo::create($dati + ['institution_id' => $inst]);
                }

                $altri = array_filter(array_map('trim', explode(';', (string) ($r['id_origine_unificati'] ?? ''))));
                foreach (array_unique([$r['id_filemaker'], ...$altri]) as $origine) {
                    LuogoOrigine::updateOrCreate(['institution_id' => $inst, 'id_origine' => $origine], ['luogo_id' => $luogo->id]);
                }
                $mappa[] = ['id_origine' => $r['id_filemaker'], 'id_proxi' => $luogo->id, 'nome' => $luogo->nome];
            }

            // i luoghi che non vengono dal file (es. quelli di prova) si archiviano (restano nel log)
            foreach ($daArchiviare as $a) {
                Luogo::forInstitution($inst)->find($a['id'])?->delete();
            }

            return $mappa;
        });

        return response()->json(['applicato' => true, 'mappa' => $mappa] + $esito);
    }

    private function daControllare(array $r): bool
    {
        $q = (string) ($r['geo_qualita'] ?? '');

        return str_starts_with($q, 'approssimata') || str_starts_with($q, 'ricostruita') || str_starts_with($q, 'assente') || str_starts_with($q, 'estero');
    }

    private function chiave(string $nome): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $nome)));
    }

    private function nullo(?string $v): ?string
    {
        $v = trim((string) $v);

        return $v === '' ? null : $v;
    }

    // CSV con intestazione (anche con BOM, separatore virgola o punto e virgola) -> righe associative
    private function leggi(string $percorso): array
    {
        $testo = (string) file_get_contents($percorso);
        $testo = preg_replace('/^\xEF\xBB\xBF/', '', $testo);
        if (! mb_check_encoding($testo, 'UTF-8')) $testo = mb_convert_encoding($testo, 'UTF-8', 'Windows-1252');
        $sep = substr_count(strtok($testo, "\n") ?: '', ';') > substr_count(strtok($testo, "\n") ?: '', ',') ? ';' : ',';

        $f = fopen('php://temp', 'r+');
        fwrite($f, $testo);
        rewind($f);
        $intestazione = fgetcsv($f, 0, $sep, '"', '');
        $righe = [];
        while (($c = fgetcsv($f, 0, $sep, '"', '')) !== false) {
            if ($c === [null] || count(array_filter($c, fn ($x) => $x !== null && $x !== '')) === 0) continue;
            $righe[] = array_combine($intestazione, array_pad(array_slice($c, 0, count($intestazione)), count($intestazione), ''));
        }
        fclose($f);

        return $righe;
    }
}
