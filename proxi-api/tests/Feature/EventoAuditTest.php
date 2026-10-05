<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Evento;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventoAuditTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Luogo $luogo;

    protected function setUp(): void
    {
        parent::setUp();

        $inst = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        $this->user = User::factory()->create(['institution_id' => $inst->id, 'role' => 'educatore']);
        $this->luogo = Luogo::create(['institution_id' => $inst->id, 'nome' => 'Piazza', 'tipo' => 'strada']);
        Sanctum::actingAs($this->user);
        AuditLog::query()->getQuery()->delete();
    }

    private function payload(array $over = []): array
    {
        return array_merge([
            'tipo' => 'incontro', 'data' => '2026-10-05', 'ora_inizio' => '18:30',
            'durata_min' => 45, 'luogo_id' => $this->luogo->id, 'stato' => 'completato',
        ], $over);
    }

    public function test_il_luogo_e_obbligatorio(): void
    {
        $this->postJson('/api/eventi', $this->payload(['luogo_id' => null]))
            ->assertStatus(422)->assertJsonValidationErrors('luogo_id');

        $this->postJson('/api/eventi', collect($this->payload())->except('luogo_id')->all())
            ->assertStatus(422)->assertJsonValidationErrors('luogo_id');
    }

    public function test_non_si_usa_un_luogo_di_un_altro_ente(): void
    {
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Luogo::create(['institution_id' => $altro->id, 'nome' => 'X', 'tipo' => 'strada']);

        $this->postJson('/api/eventi', $this->payload(['luogo_id' => $estraneo->id]))
            ->assertStatus(422)->assertJsonValidationErrors('luogo_id');
    }

    public function test_creazione_con_persone_e_audit(): void
    {
        $p = Persona::create(['institution_id' => $this->user->institution_id, 'nome' => 'Marco']);

        $res = $this->postJson('/api/eventi', $this->payload(['persone_ids' => [$p->id]]))
            ->assertCreated();

        $id = $res->json('id');
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'created', 'auditable_type' => 'Evento', 'auditable_id' => $id,
            'user_id' => $this->user->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'updated', 'auditable_type' => 'Evento', 'auditable_id' => $id,
        ]);
    }

    public function test_modifica_registra_vecchi_e_nuovi_valori(): void
    {
        $e = Evento::create($this->payload() + [
            'institution_id' => $this->user->institution_id, 'educatore_id' => $this->user->id,
        ]);
        AuditLog::query()->getQuery()->delete();

        $this->patchJson("/api/eventi/{$e->id}", ['durata_min' => 60, 'stato' => 'pianificato'])
            ->assertOk()->assertJsonPath('durata_min', 60);

        $log = AuditLog::where('action', 'updated')->where('auditable_id', $e->id)->firstOrFail();
        $this->assertEquals(45, $log->old_values['durata_min']);
        $this->assertEquals(60, $log->new_values['durata_min']);
        $this->assertEquals('pianificato', $log->new_values['stato']);
    }

    public function test_eliminazione_salva_snapshot_con_persone(): void
    {
        $p = Persona::create(['institution_id' => $this->user->institution_id, 'nome' => 'Marco']);
        $e = Evento::create($this->payload() + [
            'institution_id' => $this->user->institution_id, 'educatore_id' => $this->user->id,
        ]);
        $e->persone()->sync([$p->id]);
        AuditLog::query()->getQuery()->delete();

        $this->deleteJson("/api/eventi/{$e->id}")->assertNoContent();

        $this->assertDatabaseMissing('eventi', ['id' => $e->id]);
        $log = AuditLog::where('action', 'deleted')->where('auditable_id', $e->id)->firstOrFail();
        $this->assertEquals([$p->id], $log->old_values['persone_ids']);
        $this->assertEquals('incontro', $log->old_values['tipo']);
    }

    public function test_il_log_non_e_modificabile(): void
    {
        $this->postJson('/api/eventi', $this->payload())->assertCreated();
        $log = AuditLog::firstOrFail();
        $originale = $log->action;

        $this->assertFalse($log->update(['action' => 'x']));
        $this->assertFalse($log->delete());
        $this->assertDatabaseHas('audit_logs', ['id' => $log->id, 'action' => $originale]);
    }

    public function test_lettura_audit_solo_per_coordinatori(): void
    {
        $this->getJson('/api/audit')->assertForbidden();

        $coord = User::factory()->create([
            'institution_id' => $this->user->institution_id, 'role' => 'coordinatore',
        ]);
        Sanctum::actingAs($coord);
        $this->getJson('/api/audit')->assertOk();
    }

    public function test_login_e_logout_sono_registrati_e_non_dipendono_dalla_tabella(): void
    {
        $this->user->forceFill(['password' => 'segreta123'])->save();
        AuditLog::query()->getQuery()->delete();
        $this->app['auth']->forgetGuards();

        $res = $this->postJson('/api/auth/login', ['email' => $this->user->email, 'password' => 'segreta123'])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action' => 'login', 'user_id' => $this->user->id]);
        $this->assertArrayNotHasKey('password', AuditLog::where('action', 'login')->first()->toArray());

        \Illuminate\Support\Facades\Schema::drop('audit_logs');
        $this->postJson('/api/auth/login', ['email' => $this->user->email, 'password' => 'segreta123'])
            ->assertOk();
    }

    public function test_completo_richiede_tutti_i_campi_note_comprese(): void
    {
        $p = Persona::create(['institution_id' => $this->user->institution_id, 'nome' => 'Marco']);

        $id = $this->postJson('/api/eventi', $this->payload())->assertCreated()
            ->assertJsonPath('completo', false)
            ->assertJsonPath('mancanti', ['persone', 'note'])
            ->json('id');

        $this->patchJson("/api/eventi/{$id}", ['note' => 'ok'])
            ->assertJsonPath('mancanti', ['persone']);

        $this->patchJson("/api/eventi/{$id}", ['persone_ids' => [$p->id]])
            ->assertJsonPath('completo', true)
            ->assertJsonPath('mancanti', []);

        $this->patchJson("/api/eventi/{$id}", ['note' => '   '])
            ->assertJsonPath('completo', false);

        $this->getJson('/api/eventi')->assertJsonPath('0.completo', false);
    }

    public function test_scheda_persona_validazione_e_audit(): void
    {
        $this->postJson('/api/persone', ['ruolo' => 'utente'])
            ->assertStatus(422)->assertJsonValidationErrors('nome');

        $this->postJson('/api/persone', ['nome' => 'Marco', 'anonimo' => true])
            ->assertStatus(422)->assertJsonValidationErrors('soprannome');

        $id = $this->postJson('/api/persone', [
            'ruolo' => 'utente', 'soprannome' => 'Gigi', 'anonimo' => true,
            'eta' => 40, 'lingue' => ['IT', 'FR'], 'tag' => ['alcol'],
        ])->assertCreated()->json('id');

        $this->patchJson("/api/persone/{$id}", ['eta' => 41, 'tag' => ['alcol', 'minore']])->assertOk();

        $log = AuditLog::where('auditable_type', 'Persona')->where('action', 'updated')->firstOrFail();
        $this->assertEquals(40, $log->old_values['eta']);
        $this->assertEquals(41, $log->new_values['eta']);

        $this->deleteJson("/api/persone/{$id}")->assertNoContent();
        $this->assertDatabaseHas('audit_logs', ['action' => 'deleted', 'auditable_type' => 'Persona', 'auditable_id' => $id]);
    }

    public function test_dettaglio_modifica_ed_eliminazione_rispettano_l_ente(): void
    {
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estranea = Persona::create(['institution_id' => $altro->id, 'nome' => 'Estranea']);
        $estraneo = Luogo::create(['institution_id' => $altro->id, 'nome' => 'X', 'tipo' => 'strada']);
        $mia = Persona::create(['institution_id' => $this->user->institution_id, 'nome' => 'Mia']);

        $this->getJson("/api/persone/{$mia->id}")->assertOk()->assertJsonPath('nome', 'Mia');
        $this->getJson("/api/luoghi/{$this->luogo->id}")->assertOk()->assertJsonPath('nome', 'Piazza');
        $this->patchJson("/api/luoghi/{$this->luogo->id}", ['nome' => 'Nuova'])->assertOk();

        foreach (["/api/persone/{$estranea->id}", "/api/luoghi/{$estraneo->id}"] as $url) {
            $this->getJson($url)->assertNotFound();
            $this->deleteJson($url)->assertNotFound();
        }
    }

    public function test_non_si_puo_svuotare_l_identita_di_una_persona(): void
    {
        $p = Persona::create(['institution_id' => $this->user->institution_id, 'nome' => 'Marco']);

        $this->patchJson("/api/persone/{$p->id}", ['nome' => null])
            ->assertStatus(422)->assertJsonValidationErrors('nome');

        $this->patchJson("/api/persone/{$p->id}", ['nome' => null, 'soprannome' => 'Gigi'])->assertOk();
    }
}
