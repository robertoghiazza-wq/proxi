<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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

        if ($azione === 'stato') {
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
