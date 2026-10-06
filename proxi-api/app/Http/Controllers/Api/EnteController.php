<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Personalizzazione dell'ente (brand): nome, colore di accento, logo. Solo gli admin modificano.
class EnteController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $ente = $this->ente($request);
        $d = $request->validate([
            'name'         => 'sometimes|required|string|max:120',
            'accent_color' => ['sometimes', 'required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ], ['accent_color.regex' => 'Il colore deve essere nel formato #rrggbb']);

        if (isset($d['accent_color'])) {
            $d['accent_color'] = strtolower($d['accent_color']);
        }
        $ente->forceFill($d)->save();

        return response()->json($ente->fresh());
    }

    public function logo(Request $request): StreamedResponse
    {
        $ente = Institution::findOrFail($request->user()->institution_id);
        $path = $ente->getAttributes()['logo_path'] ?? null;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        $mime = str_ends_with($path, '.svg') ? 'image/svg+xml' : (str_ends_with($path, '.png') ? 'image/png' : (str_ends_with($path, '.webp') ? 'image/webp' : 'image/jpeg'));

        return Storage::disk('local')->response($path, null, [
            'Content-Type'            => $mime,
            'X-Content-Type-Options'  => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            'Cache-Control'           => 'private, max-age=3600',
        ]);
    }

    public function caricaLogo(Request $request): JsonResponse
    {
        $ente = $this->ente($request);
        $request->validate(
            ['logo' => 'required|file|max:2048|mimes:png,jpg,jpeg,webp,svg'],
            ['logo.required' => 'Scegli un file', 'logo.uploaded' => 'Il file non è arrivato al server', 'logo.max' => 'Il logo supera i 2 MB', 'logo.mimes' => 'Formato non ammesso (PNG, JPG, WebP, SVG)'],
        );

        $file = $request->file('logo');
        if (strtolower($file->getClientOriginalExtension()) === 'svg') {
            $svg = (string) file_get_contents($file->getRealPath());
            abort_if(preg_match('/<script|javascript:|\son\w+\s*=|<foreignObject|<iframe|<!ENTITY/i', $svg), 422, 'Il file SVG contiene elementi non ammessi (script o contenuti esterni).');
        }

        $vecchio = $ente->getAttributes()['logo_path'] ?? null;
        $nuovo = $file->storeAs("enti/{$ente->id}", 'logo-'.time().'.'.strtolower($file->getClientOriginalExtension() ?: 'png'), 'local');
        $ente->forceFill(['logo_path' => $nuovo])->save();
        AuditLog::record('updated', $ente, null, null, ['campo' => 'logo']);
        if ($vecchio) {
            Storage::disk('local')->delete($vecchio);
        }

        return response()->json($ente->fresh());
    }

    public function rimuoviLogo(Request $request): JsonResponse
    {
        $ente = $this->ente($request);
        $vecchio = $ente->getAttributes()['logo_path'] ?? null;
        if ($vecchio) {
            Storage::disk('local')->delete($vecchio);
            $ente->forceFill(['logo_path' => null])->save();
            AuditLog::record('updated', $ente, null, null, ['campo' => 'logo', 'rimosso' => true]);
        }

        return response()->json($ente->fresh());
    }

    private function ente(Request $request): Institution
    {
        abort_unless($request->user()->isAdmin(), 403, 'Solo un admin può modificare il brand.');

        return Institution::findOrFail($request->user()->institution_id);
    }
}
