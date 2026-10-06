<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\Persona;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfiloUtenteTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $user;
    private Persona $utente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p']);
        $this->user = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore', 'name' => 'Educatrice Uno']);
        $this->utente = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'Luca']);
        Sanctum::actingAs($this->user);
    }

    public function test_elenchi_predefiniti_e_gestione_solo_per_i_gestori(): void
    {
        $r = $this->getJson('/api/vocaboli')->assertOk();
        $this->assertArrayHasKey('situazione_familiare', $r->json('categorie'));
        $this->assertGreaterThan(50, count($r->json('voci')));

        $this->postJson('/api/vocaboli', ['categoria' => 'origine', 'valore' => 'Cile'])->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore']));
        $id = $this->postJson('/api/vocaboli', ['categoria' => 'origine', 'valore' => 'Cile'])->assertCreated()->json('id');
        $this->postJson('/api/vocaboli', ['categoria' => 'origine', 'valore' => 'Cile'])->assertStatus(422);
        $this->postJson('/api/vocaboli', ['categoria' => 'inventata', 'valore' => 'X'])->assertStatus(422);
        $this->patchJson("/api/vocaboli/{$id}", ['valore' => 'Cile (Santiago)'])->assertOk();
        $this->deleteJson("/api/vocaboli/{$id}")->assertNoContent();
    }

    public function test_profilo_info_note_e_sostanze_con_audit(): void
    {
        $this->getJson("/api/persone/{$this->utente->id}/profilo")->assertOk()
            ->assertJsonPath('profilo.storia_medica', null)->assertJsonCount(0, 'sostanze');

        $this->putJson("/api/persone/{$this->utente->id}/profilo", [
            'situazione_familiare' => 'Famiglia ricomposta', 'origine' => 'Svizzera', 'patente' => '  ',
            'storia_medica' => 'Allergia ai pollini.',
            'sostanze' => [
                ['sostanza' => 'Cannabis', 'con_chi' => 'Con amici', 'frequenza' => 'Settimanale', 'abuso' => 'No', 'note' => ''],
                ['sostanza' => '', 'con_chi' => '', 'frequenza' => '', 'abuso' => '', 'note' => ''],
            ],
        ])->assertOk()
            ->assertJsonPath('profilo.situazione_familiare', 'Famiglia ricomposta')
            ->assertJsonPath('profilo.patente', null)
            ->assertJsonCount(1, 'sostanze')->assertJsonPath('sostanze.0.sostanza', 'Cannabis');

        $this->assertDatabaseHas('audit_logs', ['action' => 'created', 'auditable_type' => 'PersonaProfilo']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'updated', 'auditable_type' => 'Persona', 'auditable_id' => $this->utente->id]);

        $this->putJson("/api/persone/{$this->utente->id}/profilo", ['storia_medica' => 'Aggiornata'])->assertOk()
            ->assertJsonPath('profilo.situazione_familiare', 'Famiglia ricomposta')->assertJsonCount(1, 'sostanze');
        $log = AuditLog::where('auditable_type', 'PersonaProfilo')->where('action', 'updated')->firstOrFail();
        $this->assertSame('Allergia ai pollini.', $log->old_values['storia_medica']);
    }

    public function test_la_lettura_e_registrata_una_volta_ogni_dieci_minuti(): void
    {
        $this->getJson("/api/persone/{$this->utente->id}/profilo")->assertOk();
        $this->getJson("/api/persone/{$this->utente->id}/profilo")->assertOk();

        $this->assertSame(1, AuditLog::where('action', 'viewed')->where('auditable_id', $this->utente->id)->count());
        $this->assertSame($this->user->id, AuditLog::where('action', 'viewed')->first()->user_id);
    }

    public function test_solo_gli_utenti_della_propria_struttura(): void
    {
        $collega = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Dario']);
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Persona::create(['institution_id' => $altro->id, 'ruolo' => 'utente', 'nome' => 'X']);

        $this->getJson("/api/persone/{$collega->id}/profilo")->assertNotFound();
        $this->getJson("/api/persone/{$estraneo->id}/profilo")->assertNotFound();
        $this->putJson("/api/persone/{$estraneo->id}/profilo", ['storia_medica' => 'x'])->assertNotFound();
        $this->postJson("/api/persone/{$estraneo->id}/diario", ['data' => today()->toDateString(), 'nota' => 'x'])->assertNotFound();
    }

    public function test_diario_voci_autore_e_permessi(): void
    {
        $id = $this->postJson("/api/persone/{$this->utente->id}/diario", ['data' => '2026-10-01', 'nota' => 'Primo colloquio'])
            ->assertCreated()->assertJsonPath('autore.name', 'Educatrice Uno')->json('id');

        $this->postJson("/api/persone/{$this->utente->id}/diario", ['data' => now()->addDay()->toDateString(), 'nota' => 'x'])->assertStatus(422);
        $this->postJson("/api/persone/{$this->utente->id}/diario", ['data' => '2026-10-02', 'nota' => ''])->assertStatus(422);
        $this->postJson("/api/persone/{$this->utente->id}/diario", ['data' => '2026-10-03', 'nota' => 'Terzo'])->assertCreated();

        $voci = $this->getJson("/api/persone/{$this->utente->id}/profilo")->json('diario');
        $this->assertSame(['2026-10-03', '2026-10-01'], array_column($voci, 'data'));

        $this->patchJson("/api/diario/{$id}", ['nota' => 'Primo colloquio (corretto)'])->assertOk();

        $altra = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($altra);
        $this->patchJson("/api/diario/{$id}", ['nota' => 'manomesso'])->assertForbidden();
        $this->deleteJson("/api/diario/{$id}")->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore']));
        $this->deleteJson("/api/diario/{$id}")->assertNoContent();
        $this->assertDatabaseHas('audit_logs', ['action' => 'deleted', 'auditable_type' => 'PersonaDiario', 'auditable_id' => $id]);
    }
}
