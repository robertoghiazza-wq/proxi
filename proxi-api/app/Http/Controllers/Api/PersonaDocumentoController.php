<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Persona;
use App\Models\PersonaDocumento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Documenti allegati a una persona (certificati, contratti firmati, ...). File su disco privato,
// scaricabili solo da utenti autenticati dello stesso ente. I documenti dei dipendenti: solo coordinatori e admin.
class PersonaDocumentoController extends Controller
{
    public const TIPI = [
        'utente'     => ['Documento d’identità', 'Permesso di soggiorno', 'Certificato medico', 'Consenso o autorizzazione', 'Documento sociale', 'Altro'],
        'dipendente' => ['Contratto firmato', 'Documento d’identità', 'Permesso di lavoro', 'Diploma o attestato', 'Certificato medico', 'Altro'],
        'rete'       => ['Convenzione o accordo', 'Altro'],
    ];

    private const ESTENSIONI = 'pdf,jpg,jpeg,png,webp,heic,heif,doc,docx,xls,xlsx,odt,ods,txt';
    private const MAX_KB = 15360;

    public function index(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->persona($request, $personaId);

        $recente = AuditLog::where('user_id', $request->user()->id)->where('action', 'viewed')
            ->where('auditable_type', 'Persona')->where('auditable_id', $persona->id)
            ->where('meta->sezione', 'documenti')->where('created_at', '>=', now()->subMinutes(10))->exists();
        if (! $recente && $persona->ruolo !== 'rete') {
            AuditLog::record('viewed', $persona, null, null, ['sezione' => 'documenti']);
        }

        return response()->json([
            'tipi'      => self::TIPI[$persona->ruolo] ?? ['Altro'],
            'documenti' => $persona->documenti()->with('autore:id,name')->get(),
        ]);
    }

    public function store(Request $request, int $personaId): JsonResponse
    {
        $persona = $this->persona($request, $personaId);

        $data = $request->validate([
            'file'   => 'required|file|max:'.self::MAX_KB.'|mimes:'.self::ESTENSIONI,
            'tipo'   => 'nullable|string|max:60',
            'titolo' => 'nullable|string|max:200',
            'note'   => 'nullable|string|max:5000',
        ], [
            'file.required' => 'Scegli un file da allegare',
            'file.uploaded' => 'Il file non è arrivato al server: è probabilmente troppo grande',
            'file.max'      => 'Il file supera i 15 MB',
            'file.mimes'    => 'Formato non ammesso (PDF, immagini, Word, Excel, testo)',
        ]);

        $file = $request->file('file');
        $percorso = $file->store("persone/{$persona->institution_id}/{$persona->id}", 'local');
        $nome = $file->getClientOriginalName();

        $doc = PersonaDocumento::create([
            'institution_id' => $persona->institution_id,
            'persona_id'     => $persona->id,
            'tipo'           => $data['tipo'] ?? null,
            'titolo'         => trim($data['titolo'] ?? '') ?: pathinfo($nome, PATHINFO_FILENAME),
            'note'           => $data['note'] ?? null,
            'percorso'       => $percorso,
            'nome_originale' => $nome,
            'mime'           => $file->getMimeType() ?: 'application/octet-stream',
            'dimensione'     => $file->getSize(),
            'caricato_da'    => $request->user()->id,
        ]);

        return response()->json($doc->load('autore:id,name'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $doc = $this->documento($request, $id);
        $doc->update($request->validate([
            'tipo'   => 'nullable|string|max:60',
            'titolo' => 'sometimes|required|string|max:200',
            'note'   => 'nullable|string|max:5000',
        ]));

        return response()->json($doc->load('autore:id,name'));
    }

    public function scarica(Request $request, int $id): StreamedResponse
    {
        $doc = $this->documento($request, $id);
        abort_unless(Storage::disk('local')->exists($doc->percorso), 404, 'File non trovato sul server');

        if ($doc->persona->ruolo !== 'rete') {
            AuditLog::record('downloaded', $doc, null, null, ['titolo' => $doc->titolo]);
        }

        return Storage::disk('local')->response($doc->percorso, $doc->nome_originale, [
            'Content-Type'           => $doc->mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control'          => 'private, max-age=0, no-store',
        ]);
    }

    // L'eliminazione è logica (finisce nel log); il file resta sul disco e si può recuperare.
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->documento($request, $id)->delete();

        return response()->json(null, 204);
    }

    private function persona(Request $request, int $personaId): Persona
    {
        $persona = Persona::forInstitution($request->user()->institution_id)->findOrFail($personaId);
        $this->autorizza($request, $persona);

        return $persona;
    }

    private function documento(Request $request, int $id): PersonaDocumento
    {
        $doc = PersonaDocumento::where('institution_id', $request->user()->institution_id)->with('persona')->findOrFail($id);
        $this->autorizza($request, $doc->persona);

        return $doc;
    }

    private function autorizza(Request $request, Persona $persona): void
    {
        if ($persona->ruolo === 'dipendente') {
            abort_unless(in_array($request->user()->role, ['coordinatore', 'admin'], true), 403);
        }
    }
}
