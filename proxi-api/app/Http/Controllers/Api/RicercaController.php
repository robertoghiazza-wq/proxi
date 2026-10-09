<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use App\Support\Ricerca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Ricerca estesa per sezione (persone, luoghi, eventi, servizi): per ogni record trovato dice in quali campi compare la parola
class RicercaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $dati = $request->validate([
            'ambito' => 'required|in:persone,luoghi,eventi,servizi',
            'q'      => 'required|string|min:2|max:200',
        ]);

        $trovati = Ricerca::esegui($request->user()->institution_id, $dati['ambito'], $dati['q']);
        if ($dati['ambito'] === 'persone') $this->registraLetture($request, $trovati);

        return response()->json(collect($trovati)->map(fn ($trovato, $id) => ['id' => (int) $id, 'trovato' => $trovato])->values());
    }

    // Se l'elenco mostra pezzi di diario, profilo, note o documenti è una lettura come aprire la scheda: va nel registro
    // (una riga per utente e persona ogni 10 minuti, come per le schede).
    private const RISERVATI = ['Diario', 'Profilo', 'Note e bisogni', 'Documenti'];

    private function registraLetture(Request $request, array $trovati): void
    {
        $sezioni = [];
        foreach ($trovati as $id => $hit) {
            $campi = collect($hit)->filter(fn ($h) => in_array($h['campo'], self::RISERVATI, true) && ($h['estratto'] ?? null) !== null)
                ->pluck('campo')->map(fn ($c) => mb_strtolower($c))->all();
            if ($campi) $sezioni[$id] = 'ricerca: '.implode(', ', $campi);
        }
        if (! $sezioni) return;

        $user = $request->user();
        $recenti = AuditLog::where('user_id', $user->id)->where('action', 'viewed')->where('auditable_type', 'Persona')
            ->whereIn('auditable_id', array_keys($sezioni))->where('meta->sezione', 'like', 'ricerca%')
            ->where('created_at', '>=', now()->subMinutes(10))->pluck('auditable_id')->all();

        $da = array_diff(array_keys($sezioni), $recenti);
        foreach (Persona::forInstitution($user->institution_id)->whereIn('id', $da)->get() as $persona) {
            AuditLog::record('viewed', $persona, null, null, ['sezione' => $sezioni[$persona->id]]);
        }
    }
}
