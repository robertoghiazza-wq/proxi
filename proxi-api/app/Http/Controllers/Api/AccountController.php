<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

// Account di accesso di un dipendente. Niente password di default: l'accesso si imposta con un link a uso singolo.
class AccountController extends Controller
{
    private const SCADENZA_GIORNI = 7;

    public function show(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);

        return response()->json(['account' => $this->dto($persona->account)]);
    }

    public function store(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);
        abort_if($persona->account()->exists(), 422, 'Questa persona ha già un account.');

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role'  => ['required', Rule::in(['educatore', 'coordinatore', 'admin'])],
        ], ['email.unique' => 'Questa email è già usata da un altro account.']);
        $this->verificaRuolo($request, $data['role']);

        [$token, $hash] = $this->nuovoInvito();

        $user = DB::transaction(function () use ($persona, $data, $hash) {
            $user = new User();
            $user->forceFill([
                'name' => trim("{$persona->nome} {$persona->cognome}") ?: ($persona->soprannome ?? $data['email']),
                'email' => $data['email'],
                'password' => Str::random(48),
                'institution_id' => $persona->institution_id,
                'role' => $data['role'],
                'persona_id' => $persona->id,
                'attivo' => true,
                'invito_hash' => $hash,
                'invito_scade_il' => now()->addDays(self::SCADENZA_GIORNI),
            ])->save();

            if (blank($persona->email)) {
                $persona->update(['email' => $data['email']]);
            }

            return $user;
        });

        return response()->json(['account' => $this->dto($user), 'link_invito' => $this->link($request, $user->email, $token)], 201);
    }

    public function update(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);
        $account = $persona->account ?? abort(404);
        abort_if($account->id === $request->user()->id, 422, 'Non puoi modificare il tuo stesso account.');

        $data = $request->validate([
            'role'   => ['sometimes', Rule::in(['educatore', 'coordinatore', 'admin'])],
            'attivo' => 'sometimes|boolean',
        ]);

        if (isset($data['role'])) {
            $this->verificaRuolo($request, $data['role']);
        }
        if ($account->role === 'admin' && ((isset($data['role']) && $data['role'] !== 'admin') || (isset($data['attivo']) && ! $data['attivo']))) {
            $altri = User::where('institution_id', $account->institution_id)->where('role', 'admin')->where('attivo', true)->where('id', '!=', $account->id)->exists();
            abort_unless($altri, 422, 'Deve restare almeno un admin attivo.');
        }

        $account->forceFill($data)->save();
        if (isset($data['attivo']) && ! $data['attivo']) {
            $account->tokens()->delete();
        }

        return response()->json(['account' => $this->dto($account->fresh())]);
    }

    // Nuovo link di accesso (la vecchia password non vale più, i dispositivi collegati vengono scollegati).
    public function reset(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->dipendente($request, $personaId);
        $account = $persona->account ?? abort(404);
        abort_if($account->id === $request->user()->id, 422, 'Per cambiare la tua password usa il Profilo.');

        [$token, $hash] = $this->nuovoInvito();
        $account->forceFill(['password' => Str::random(48), 'invito_hash' => $hash, 'invito_scade_il' => now()->addDays(self::SCADENZA_GIORNI)])->save();
        $account->tokens()->delete();
        AuditLog::record('password_reset_requested', $account);

        return response()->json(['account' => $this->dto($account->fresh()), 'link_invito' => $this->link($request, $account->email, $token)]);
    }

    private function dto(?User $u): ?array
    {
        return $u ? [
            'id' => $u->id,
            'email' => $u->email,
            'role' => $u->role,
            'attivo' => (bool) $u->attivo,
            'ultimo_accesso_il' => $u->ultimo_accesso_il?->toIso8601String(),
            'invito_in_corso' => $u->invito_hash !== null && $u->invito_scade_il?->isFuture(),
            'invito_scaduto' => $u->invito_hash !== null && ! $u->invito_scade_il?->isFuture(),
            'invito_scade_il' => $u->invito_hash ? $u->invito_scade_il?->toIso8601String() : null,
        ] : null;
    }

    private function nuovoInvito(): array
    {
        $token = Str::random(48);

        return [$token, hash('sha256', $token)];
    }

    private function link(Request $request, string $email, string $token): string
    {
        $base = rtrim((string) ($request->header('Origin') ?: config('app.url')), '/');

        return $base . '/imposta-password?email=' . urlencode($email) . '&token=' . $token;
    }

    // Coordinatori e admin gestiscono gli account; coordinatore e admin possono assegnarli solo gli admin.
    private function verificaRuolo(Request $request, string $role): void
    {
        abort_if($role !== 'educatore' && $request->user()->role !== 'admin', 403, 'Solo un admin può assegnare il ruolo di coordinatore o admin.');
    }

    private function dipendente(Request $request, int $id): Persona
    {
        abort_unless(in_array($request->user()->role, ['coordinatore', 'admin'], true), 403);
        $persona = Persona::forInstitution($request->user()->institution_id)->findOrFail($id);
        abort_unless($persona->ruolo === 'dipendente', 404);

        return $persona;
    }
}
