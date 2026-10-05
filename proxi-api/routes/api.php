<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check pubblico
Route::get('/ping', fn () => response()->json(['ok' => true]));

// Migrazioni via URL (hosting senza SSH): richiede MIGRATE_TOKEN nel .env, altrimenti 404
Route::middleware('throttle:10,1')->prefix('deploy')->group(function () {
    Route::get('/migrate', [\App\Http\Controllers\DeployController::class, 'migrate']);
    Route::get('/migrate-status', [\App\Http\Controllers\DeployController::class, 'stato']);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
});

// Rotte protette — tutte richiedono token Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Utente corrente
    Route::get('/me', fn (Request $request) => $request->user()->load('institution'));

    // Persone
    Route::apiResource('persone', \App\Http\Controllers\Api\PersonaController::class);

    // Elenco ruoli (maschile/femminile) usati per le persone e come default negli eventi
    Route::apiResource('ruoli', \App\Http\Controllers\Api\RuoloController::class)->except('show');

    // Servizi (enti della rete) e persone collegate
    Route::apiResource('servizi', \App\Http\Controllers\Api\ServizioController::class);
    Route::put('/servizi/{servizio}/persone', [\App\Http\Controllers\Api\ServizioController::class, 'syncPersone']);

    // Luoghi
    Route::apiResource('luoghi', \App\Http\Controllers\Api\LuogoController::class);

    // Eventi
    Route::apiResource('eventi', \App\Http\Controllers\Api\EventoController::class);
    Route::post('/eventi/{evento}/persone', [\App\Http\Controllers\Api\EventoController::class, 'syncPersone']);

    // Spese
    Route::apiResource('spese', \App\Http\Controllers\Api\SpesaController::class);

    // Veicoli & viaggi
    Route::apiResource('veicoli', \App\Http\Controllers\Api\VeicoloController::class);
    Route::apiResource('viaggi', \App\Http\Controllers\Api\ViaggiController::class);

    // Audit log (sola lettura, solo coordinatori/admin)
    Route::get('/audit', [\App\Http\Controllers\Api\AuditController::class, 'index']);

    // Obiettivi
    Route::apiResource('obiettivi', \App\Http\Controllers\Api\ObiettivoController::class);

});
