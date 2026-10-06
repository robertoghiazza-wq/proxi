<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

// Migrazioni da browser per hosting senza SSH: pagina con accesso (email e password Proxi), solo admin.
class DeployController extends Controller
{
    private const RUOLI = ['admin', 'superadmin'];

    public function pagina(): Response
    {
        return $this->html($this->modulo());
    }

    public function esegui(Request $request): Response
    {
        $email = trim((string) $request->input('email'));
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check((string) $request->input('password'), $user->password) || ! in_array($user->role, self::RUOLI, true)) {
            Log::warning('Accesso negato alla pagina migrazioni', ['ip' => $request->ip(), 'email' => $email]);

            return $this->html($this->modulo('Credenziali non valide o permessi insufficienti (serve un account admin).', $email), 403);
        }

        $azione = (string) $request->input('azione');
        Log::warning('Pagina migrazioni usata', ['user_id' => $user->id, 'azione' => $azione, 'ip' => $request->ip()]);

        if ($azione === 'diagnosi') {
            $esito = $this->diagnosi();
        } elseif ($azione === 'errori') {
            $esito = $this->ultimiErrori();
        } elseif ($azione === 'stato') {
            Artisan::call('migrate:status');
            $esito = Artisan::output();
        } else {
            $anteprima = $azione === 'anteprima';
            $exit = Artisan::call('migrate', ['--force' => true] + ($anteprima ? ['--pretend' => true] : []));
            $esito = ($anteprima ? "[ANTEPRIMA: nulla è stato modificato]\n" : '') . Artisan::output()
                . ($exit === 0 ? "\nOK\n" : "\nERRORE (codice {$exit})\n");
        }

        return $this->html($this->modulo(null, $email, $esito), isset($exit) && $exit !== 0 ? 500 : 200);
    }

    // Controlla che tabelle e colonne attese ci siano e prova le query delle liste, mostrando l'errore vero.
    private function diagnosi(): string
    {
        $righe = [];
        $prova = function (string $nome, callable $f) use (&$righe) {
            try {
                $r = $f();
                $righe[] = '[ok]     ' . $nome . ($r !== null ? '  →  ' . $r : '');
            } catch (Throwable $e) {
                $righe[] = '[ERRORE] ' . $nome . "\n           " . get_class($e) . ': ' . mb_substr($e->getMessage(), 0, 400);
            }
        };

        $attese = [
            'persone' => ['cognome', 'data_nascita', 'ruolo_id', 'indirizzo', 'npa', 'localita', 'comune_politico', 'bfs', 'cantone', 'paese', 'note_contatti'],
            'luoghi' => ['npa', 'localita', 'comune_politico', 'bfs', 'cantone'],
            'servizi' => ['nome', 'cap', 'localita', 'comune_politico', 'bfs', 'cantone'],
            'evento_persona' => ['ruolo_id'],
            'ruoli' => ['nome_m', 'nome_f', 'nome_misto'],
            'persona_telefoni' => ['numero'],
            'persona_servizio' => ['ruolo', 'principale'],
            'audit_logs' => ['action', 'auditable_type'],
            'persona_contratti' => ['persona_id', 'data_inizio', 'iban', 'avs'],
            'users' => ['persona_id', 'attivo', 'invito_hash', 'ultimo_accesso_il'],
            'ore_mensili' => ['persona_id', 'anno', 'mese', 'correzione_ore'],
            'vocaboli' => ['categoria', 'valore'],
            'persona_profili' => ['persona_id', 'storia_medica'],
            'persona_sostanze' => ['sostanza', 'frequenza'],
            'persona_diario' => ['persona_id', 'data', 'nota'],
        ];
        foreach ($attese as $tabella => $colonne) {
            $prova("tabella {$tabella}", function () use ($tabella, $colonne) {
                if (! Schema::hasTable($tabella)) {
                    throw new \RuntimeException('la tabella non esiste: la migrazione non è stata eseguita');
                }
                $mancanti = array_values(array_filter($colonne, fn ($c) => ! Schema::hasColumn($tabella, $c)));
                if ($mancanti) {
                    throw new \RuntimeException('colonne mancanti: ' . implode(', ', $mancanti));
                }

                return DB::table($tabella)->count() . ' righe';
            });
        }

        $inst = (int) DB::table('institutions')->value('id');
        $prova('migrazioni registrate', fn () => DB::table('migrations')->orderByDesc('id')->limit(4)->pluck('migration')->implode(', '));
        $prova('lista persone', fn () => \App\Models\Persona::forInstitution($inst)->withCount('eventi')->orderBy('cognome')->orderBy('nome')->get()->toJson() ? 'ok' : null);
        $prova('lista luoghi', fn () => \App\Models\Luogo::forInstitution($inst)->withStats()->attivi()->get()->count() . ' luoghi');
        $prova('lista servizi', fn () => \App\Models\Servizio::forInstitution($inst)->withCount('persone')->get()->count() . ' servizi');
        $prova('lista ruoli', fn () => \App\Models\Ruolo::forInstitution($inst)->where('attivo', true)->count() . ' ruoli (ente ' . $inst . ')');
        $prova('elenchi a tendina', fn () => \App\Models\Vocabolo::forInstitution($inst)->count() . ' voci');
        $prova('lista eventi', fn () => \App\Models\Evento::forInstitution($inst)->with(['luogo', 'persone'])->get()->toJson() ? 'ok' : null);
        $prova('dettaglio persona', function () use ($inst) {
            $p = \App\Models\Persona::forInstitution($inst)->first();

            return $p ? ($p->load(['telefoni', 'servizi', 'eventi'])->toJson() ? 'ok' : null) : 'nessuna persona';
        });

        return implode("\n", $righe) . "\n";
    }

    private function ultimiErrori(): string
    {
        $file = storage_path('logs/laravel.log');
        if (! is_file($file)) {
            $file = collect(glob(storage_path('logs/laravel-*.log')) ?: [])->sort()->last() ?? '';
        }
        if ($file === '' || ! is_file($file)) {
            return "Nessun file di log trovato in storage/logs.\n";
        }

        $testo = (string) file_get_contents($file, false, null, max(0, filesize($file) - 60000));
        preg_match_all('/^\[\d{4}-\d{2}-\d{2} [^\]]+\] \w+\.ERROR: .*$/m', $testo, $m);

        return $m[0] ? implode("\n\n", array_map(fn ($r) => mb_substr($r, 0, 600), array_slice($m[0], -8))) . "\n"
            : "Nessun errore recente nel log.\n";
    }

    private function modulo(?string $errore = null, string $email = '', ?string $esito = null): string
    {
        $e = fn (string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

        return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Migrazioni Proxi</title>'
            . '<style>body{font:15px/1.5 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#14171c}'
            . 'input{width:100%;box-sizing:border-box;padding:10px 12px;margin:4px 0 14px;border:1px solid #ccd;border-radius:10px;font-size:16px}'
            . 'button{padding:10px 16px;border:0;border-radius:999px;font-size:15px;font-weight:600;cursor:pointer;margin-right:6px;background:#eceef2}'
            . 'button.p{background:#dc1d27;color:#fff}pre{background:#f1f2f4;padding:14px;border-radius:10px;overflow:auto;font-size:13px}'
            . '.err{background:#fdecec;color:#8a1218;padding:10px 12px;border-radius:10px;margin-bottom:14px}</style></head><body>'
            . '<h1>Migrazioni Proxi</h1>'
            . '<p>Accedi con un account <b>admin</b> di Proxi per aggiornare il database.</p>'
            . ($errore ? '<div class="err">' . $e($errore) . '</div>' : '')
            . '<form method="post"><label>Email<input name="email" type="email" value="' . $e($email) . '" autocomplete="username" required></label>'
            . '<label>Password<input name="password" type="password" autocomplete="current-password" required></label>'
            . '<button name="azione" value="anteprima">Anteprima</button>'
            . '<button name="azione" value="stato">Stato</button>'
            . '<button name="azione" value="diagnosi">Diagnosi</button>'
            . '<button name="azione" value="errori">Ultimi errori</button>'
            . '<button class="p" name="azione" value="esegui">Esegui migrazioni</button></form>'
            . ($esito !== null ? '<h2>Esito</h2><pre>' . $e($esito) . '</pre>' : '')
            . '</body></html>';
    }

    private function html(string $corpo, int $status = 200): Response
    {
        return response($corpo, $status, [
            'Content-Type' => 'text/html; charset=utf-8', 'Cache-Control' => 'no-store', 'X-Robots-Tag' => 'noindex',
        ]);
    }
}
