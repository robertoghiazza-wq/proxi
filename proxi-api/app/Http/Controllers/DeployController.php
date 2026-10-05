<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

// Migrazioni via URL per hosting senza SSH. Attivo solo se MIGRATE_TOKEN (>= 32 caratteri) è nel .env.
class DeployController extends Controller
{
    public function migrate(Request $request): Response
    {
        $this->autorizza($request);

        $pretend = $request->boolean('pretend');
        Log::warning('Migrazioni lanciate via URL', ['ip' => $request->ip(), 'pretend' => $pretend]);

        $exit = Artisan::call('migrate', ['--force' => true] + ($pretend ? ['--pretend' => true] : []));

        return $this->testo(($pretend ? "[ANTEPRIMA, nulla è stato modificato]\n" : '')
            . Artisan::output() . ($exit === 0 ? "\nOK\n" : "\nERRORE (codice {$exit})\n"), $exit === 0 ? 200 : 500);
    }

    public function stato(Request $request): Response
    {
        $this->autorizza($request);
        Artisan::call('migrate:status');

        return $this->testo(Artisan::output());
    }

    private function autorizza(Request $request): void
    {
        $atteso = (string) config('app.migrate_token');
        $dato = (string) $request->query('token');

        // 404 e non 403: da fuori l'endpoint non deve nemmeno risultare esistente
        abort_unless(strlen($atteso) >= 32 && hash_equals($atteso, $dato), 404);
    }

    private function testo(string $corpo, int $status = 200): Response
    {
        return response($corpo, $status, ['Content-Type' => 'text/plain; charset=utf-8', 'Cache-Control' => 'no-store']);
    }
}
