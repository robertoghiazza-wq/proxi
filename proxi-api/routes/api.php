<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check pubblico
Route::get('/ping', fn () => response()->json(['ok' => true]));

// Migrazioni da browser (hosting senza SSH): pagina con accesso, solo account admin
Route::middleware('throttle:10,1')->prefix('deploy')->group(function () {
    Route::get('/migrate', [\App\Http\Controllers\DeployController::class, 'pagina']);
    Route::post('/migrate', [\App\Http\Controllers\DeployController::class, 'esegui']);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/imposta-password', [\App\Http\Controllers\Api\AuthController::class, 'impostaPassword'])
        ->middleware('throttle:10,1');
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
    Route::post('/password', [\App\Http\Controllers\Api\AuthController::class, 'cambiaPassword'])
        ->middleware(['auth:sanctum', 'throttle:5,1']);
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

    // Scheda utente: info, note, sostanze (lettura registrata nel log) e diario
    Route::get('/persone/{id}/profilo', [\App\Http\Controllers\Api\PersonaProfiloController::class, 'show']);
    Route::put('/persone/{id}/profilo', [\App\Http\Controllers\Api\PersonaProfiloController::class, 'update']);
    Route::post('/persone/{id}/diario', [\App\Http\Controllers\Api\PersonaDiarioController::class, 'store']);
    Route::patch('/diario/{id}', [\App\Http\Controllers\Api\PersonaDiarioController::class, 'update']);
    Route::delete('/diario/{id}', [\App\Http\Controllers\Api\PersonaDiarioController::class, 'destroy']);

    // Documenti allegati e foto delle persone
    Route::get('/persone/{id}/documenti', [\App\Http\Controllers\Api\PersonaDocumentoController::class, 'index']);
    Route::post('/persone/{id}/documenti', [\App\Http\Controllers\Api\PersonaDocumentoController::class, 'store']);
    Route::patch('/documenti/{id}', [\App\Http\Controllers\Api\PersonaDocumentoController::class, 'update']);
    Route::get('/documenti/{id}/file', [\App\Http\Controllers\Api\PersonaDocumentoController::class, 'scarica']);
    Route::delete('/documenti/{id}', [\App\Http\Controllers\Api\PersonaDocumentoController::class, 'destroy']);
    Route::get('/persone/{id}/foto', [\App\Http\Controllers\Api\PersonaFotoController::class, 'show']);
    Route::post('/persone/{id}/foto', [\App\Http\Controllers\Api\PersonaFotoController::class, 'update']);
    Route::delete('/persone/{id}/foto', [\App\Http\Controllers\Api\PersonaFotoController::class, 'destroy']);

    // Dipendenti: contratti (dati sensibili) e account di accesso, solo coordinatori/admin
    Route::get('/persone/{id}/contratti', [\App\Http\Controllers\Api\ContrattoController::class, 'index']);
    Route::post('/persone/{id}/contratti', [\App\Http\Controllers\Api\ContrattoController::class, 'store']);
    Route::patch('/contratti/{id}', [\App\Http\Controllers\Api\ContrattoController::class, 'update']);
    Route::delete('/contratti/{id}', [\App\Http\Controllers\Api\ContrattoController::class, 'destroy']);
    Route::get('/persone/{id}/account', [\App\Http\Controllers\Api\AccountController::class, 'show']);
    Route::post('/persone/{id}/account', [\App\Http\Controllers\Api\AccountController::class, 'store']);
    Route::patch('/persone/{id}/account', [\App\Http\Controllers\Api\AccountController::class, 'update']);
    Route::post('/persone/{id}/account/reset', [\App\Http\Controllers\Api\AccountController::class, 'reset']);

    // Conteggio ore dei dipendenti ("me" = il proprio)
    Route::get('/ore/{persona}', [\App\Http\Controllers\Api\OreController::class, 'mese']);
    Route::get('/ore/{persona}/anno', [\App\Http\Controllers\Api\OreController::class, 'anno']);
    Route::put('/ore/{persona}/mese', [\App\Http\Controllers\Api\OreController::class, 'salvaMese']);

    // Elenchi a tendina
    Route::apiResource('vocaboli', \App\Http\Controllers\Api\VocaboloController::class)->except('show');

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
