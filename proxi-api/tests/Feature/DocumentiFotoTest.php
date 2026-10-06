<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\Persona;
use App\Models\PersonaDocumento;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentiFotoTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $educatore;
    private User $admin;
    private Persona $utente;
    private Persona $dip;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p']);
        $this->educatore = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        $this->admin = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'admin']);
        $this->utente = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'Anna', 'cognome' => 'Rossi']);
        $this->dip = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Dario', 'cognome' => 'Marsilio']);
        Sanctum::actingAs($this->educatore);
    }

    public function test_carica_elenca_scarica_ed_elimina_un_documento(): void
    {
        $res = $this->postJson("/api/persone/{$this->utente->id}/documenti", [
            'file' => UploadedFile::fake()->create('certificato.pdf', 120, 'application/pdf'),
            'tipo' => 'Certificato medico',
        ])->assertCreated()->assertJsonMissingPath('percorso');

        $id = $res->json('id');
        $this->assertSame('certificato', $res->json('titolo'));
        $this->assertSame($this->educatore->id, $res->json('caricato_da'));
        $this->assertCount(1, Storage::disk('local')->allFiles());

        $lista = $this->getJson("/api/persone/{$this->utente->id}/documenti")->assertOk();
        $lista->assertJsonCount(1, 'documenti');
        $this->assertContains('Certificato medico', $lista->json('tipi'));

        $this->get("/api/documenti/{$id}/file")->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertTrue(AuditLog::where('action', 'downloaded')->where('auditable_id', $id)->exists());
        $this->assertTrue(AuditLog::where('action', 'viewed')->where('meta->sezione', 'documenti')->exists());

        $this->patchJson("/api/documenti/{$id}", ['titolo' => 'Certificato 2026'])->assertOk()->assertJsonPath('titolo', 'Certificato 2026');

        $this->deleteJson("/api/documenti/{$id}")->assertNoContent();
        $this->getJson("/api/persone/{$this->utente->id}/documenti")->assertJsonCount(0, 'documenti');
        $this->assertTrue(AuditLog::where('action', 'deleted')->where('auditable_type', 'PersonaDocumento')->exists());
    }

    public function test_formati_non_ammessi_e_file_obbligatorio(): void
    {
        $this->postJson("/api/persone/{$this->utente->id}/documenti", [
            'file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload'),
        ])->assertUnprocessable()->assertJsonValidationErrors('file');
        $this->postJson("/api/persone/{$this->utente->id}/documenti", [])->assertUnprocessable();
    }

    public function test_documenti_dei_dipendenti_solo_per_i_gestori(): void
    {
        $this->getJson("/api/persone/{$this->dip->id}/documenti")->assertForbidden();
        $this->postJson("/api/persone/{$this->dip->id}/documenti", ['file' => UploadedFile::fake()->create('c.pdf', 10, 'application/pdf')])->assertForbidden();

        Sanctum::actingAs($this->admin);
        $id = $this->postJson("/api/persone/{$this->dip->id}/documenti", ['file' => UploadedFile::fake()->create('c.pdf', 10, 'application/pdf')])->assertCreated()->json('id');

        Sanctum::actingAs($this->educatore);
        $this->get("/api/documenti/{$id}/file")->assertForbidden();
        $this->deleteJson("/api/documenti/{$id}")->assertForbidden();
    }

    public function test_isolamento_tra_enti(): void
    {
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Persona::create(['institution_id' => $altro->id, 'ruolo' => 'utente', 'nome' => 'X']);
        $this->getJson("/api/persone/{$estraneo->id}/documenti")->assertNotFound();

        $doc = PersonaDocumento::create([
            'institution_id' => $altro->id, 'persona_id' => $estraneo->id, 'titolo' => 'x', 'percorso' => 'a/b.pdf',
            'nome_originale' => 'b.pdf', 'mime' => 'application/pdf', 'dimensione' => 1,
        ]);
        $this->get("/api/documenti/{$doc->id}/file")->assertNotFound();
        $this->deleteJson("/api/documenti/{$doc->id}")->assertNotFound();
    }

    public function test_foto_carica_scarica_rimuovi(): void
    {
        $this->postJson("/api/persone/{$this->utente->id}/foto", ['foto' => UploadedFile::fake()->image('f.jpg', 400, 400)])
            ->assertOk()->assertJsonPath('ha_foto', true)->assertJsonMissingPath('foto_percorso');

        $this->get("/api/persone/{$this->utente->id}/foto")->assertOk()->assertHeader('Content-Type', 'image/jpeg');
        $this->assertTrue($this->getJson("/api/persone/{$this->utente->id}")->json('ha_foto'));
        $this->assertTrue(AuditLog::where('auditable_type', 'Persona')->where('meta->campo', 'foto')->exists());

        // una nuova foto sostituisce la vecchia senza lasciare file orfani
        $this->postJson("/api/persone/{$this->utente->id}/foto", ['foto' => UploadedFile::fake()->image('g.jpg', 300, 300)])->assertOk();
        $this->assertCount(1, Storage::disk('local')->allFiles());

        $this->deleteJson("/api/persone/{$this->utente->id}/foto")->assertOk()->assertJsonPath('ha_foto', false);
        $this->get("/api/persone/{$this->utente->id}/foto")->assertNotFound();
        $this->assertCount(0, Storage::disk('local')->allFiles());
    }

    public function test_foto_non_ammessa_per_persone_anonime_o_file_non_immagine(): void
    {
        $anon = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'soprannome' => 'Lupo', 'anonimo' => true]);
        $this->postJson("/api/persone/{$anon->id}/foto", ['foto' => UploadedFile::fake()->image('f.jpg')])->assertUnprocessable();
        $this->postJson("/api/persone/{$this->utente->id}/foto", ['foto' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])->assertUnprocessable();
    }
}
