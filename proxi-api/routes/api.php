<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check pubblico
Route::get('/ping', fn () => response()->json(['ok' => true]));

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

    // Obiettivi
    Route::apiResource('obiettivi', \App\Http\Controllers\Api\ObiettivoController::class);

});
