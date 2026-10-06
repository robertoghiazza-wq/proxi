<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('institution')
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenziali non valide.'],
            ]);
        }

        if (! $user->attivo) {
            throw ValidationException::withMessages(['email' => ['Account disattivato: rivolgiti a un coordinatore.']]);
        }

        $user->forceFill(['ultimo_accesso_il' => now()])->saveQuietly();
        $token = $user->createToken('proxi-pwa')->plainTextToken;

        AuditLog::record('login', $user);

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('logout', $request->user());
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    public function cambiaPassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'string', 'confirmed', 'different:current_password', Password::min(10)->letters()->numbers()],
        ], [
            'password.confirmed' => 'Le due password nuove non coincidono.',
            'password.different' => 'La nuova password deve essere diversa da quella attuale.',
            'password.min'       => 'La nuova password deve avere almeno 10 caratteri.',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['La password attuale non è corretta.']]);
        }

        $user->password = $request->password;
        $user->save();

        // Gli altri dispositivi vengono scollegati; questo resta collegato.
        $corrente = $user->currentAccessToken();
        $user->tokens()->when($corrente?->id, fn ($q, $id) => $q->where('id', '!=', $id))->delete();

        AuditLog::record('password_changed', $user);

        return response()->json(['ok' => true]);
    }

    // Impostazione della prima password (o di una nuova) con il link ricevuto dal coordinatore.
    public function impostaPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => ['required', 'string', 'confirmed', Password::min(10)->letters()->numbers()],
        ], [
            'password.confirmed' => 'Le due password non coincidono.',
            'password.min'       => 'La password deve avere almeno 10 caratteri.',
        ]);

        $user = User::where('email', $request->email)->first();
        $valido = $user && $user->invito_hash && $user->invito_scade_il?->isFuture()
            && hash_equals($user->invito_hash, hash('sha256', (string) $request->token));

        if (! $valido) {
            throw ValidationException::withMessages(['token' => ['Link non valido o scaduto: chiedine uno nuovo a un coordinatore.']]);
        }

        $user->password = $request->password;
        $user->forceFill(['invito_hash' => null, 'invito_scade_il' => null])->save();
        $user->tokens()->delete();
        AuditLog::record('password_set', $user);

        return response()->json(['ok' => true]);
    }
}
