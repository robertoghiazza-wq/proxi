<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\Persona;
use App\Models\PersonaContratto;
use App\Models\User;
use App\Support\Validazione;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContrattoAccountTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $admin;
    private Persona $dip;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p']);
        $this->admin = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'admin', 'email' => 'admin@example.ch']);
        $this->dip = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Dario', 'cognome' => 'Marsilio']);
        Sanctum::actingAs($this->admin);
    }

    public function test_validazione_iban_e_avs(): void
    {
        $this->assertSame('CH550023423413701540B', Validazione::iban('CH55 0023 4234 1370 1540 B'));
        $this->assertNull(Validazione::iban('CH55 0023 4234 1370 1540 C'));
        $this->assertNull(Validazione::iban('non un iban'));
        $this->assertSame('756.3954.4552.25', Validazione::avs('7563954455225'));
        $this->assertSame('756.3954.4552.25', Validazione::avs('756.3954.4552.25'));
        $this->assertNull(Validazione::avs('756.3954.4552.26'));
        $this->assertNull(Validazione::avs('123.4567.8901.23'));
    }

    public function test_contratti_solo_per_gestori_e_dipendenti(): void
    {
        $educatore = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($educatore);
        $this->getJson("/api/persone/{$this->dip->id}/contratti")->assertForbidden();
        $this->postJson("/api/persone/{$this->dip->id}/contratti", ['data_inizio' => '2025-01-01'])->assertForbidden();

        Sanctum::actingAs($this->admin);
        $utente = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'U']);
        $this->getJson("/api/persone/{$utente->id}/contratti")->assertNotFound();

        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Persona::create(['institution_id' => $altro->id, 'ruolo' => 'dipendente', 'nome' => 'X']);
        $this->getJson("/api/persone/{$estraneo->id}/contratti")->assertNotFound();
    }

    public function test_contratto_crud_cifratura_audit_mascherato_e_validazioni(): void
    {
        $id = $this->postJson("/api/persone/{$this->dip->id}/contratti", [
            'data_inizio' => '2025-01-01', 'stipendio_annuo' => 45000, 'grado' => 60, 'ore_settimanali' => 24,
            'iban' => 'CH55 0023 4234 1370 1540 B', 'cassa_malati' => 'Helsana', 'avs' => '756.3954.4552.25',
        ])->assertCreated()->assertJsonPath('iban', 'CH550023423413701540B')->assertJsonPath('avs', '756.3954.4552.25')->json('id');

        $grezzo = DB::table('persona_contratti')->where('id', $id)->first();
        $this->assertStringNotContainsString('CH55', $grezzo->iban);
        $this->assertStringNotContainsString('756', $grezzo->avs);

        $log = AuditLog::where('auditable_type', 'PersonaContratto')->where('action', 'created')->firstOrFail();
        $this->assertSame('••••', $log->new_values['iban']);
        $this->assertSame('••••', $log->new_values['stipendio_annuo']);
        $this->assertSame('Helsana', $log->new_values['cassa_malati']);

        $this->getJson("/api/persone/{$this->dip->id}/contratti")->assertOk()->assertJsonCount(1)->assertJsonPath('0.iban', 'CH550023423413701540B');
        $this->assertDatabaseHas('audit_logs', ['action' => 'viewed', 'auditable_id' => $this->dip->id]);

        $this->patchJson("/api/contratti/{$id}", ['data_fine' => '2024-01-01'])->assertStatus(422)->assertJsonValidationErrors('data_fine');
        $this->patchJson("/api/contratti/{$id}", ['iban' => 'CH00 1111'])->assertStatus(422)->assertJsonValidationErrors('iban');
        $this->patchJson("/api/contratti/{$id}", ['avs' => '756.0000.0000.00'])->assertStatus(422)->assertJsonValidationErrors('avs');
        $this->patchJson("/api/contratti/{$id}", ['grado' => 150])->assertStatus(422);
        $this->patchJson("/api/contratti/{$id}", ['data_fine' => '2026-12-31', 'iban' => null])->assertOk()->assertJsonPath('iban', null);

        $this->deleteJson("/api/contratti/{$id}")->assertNoContent();
        $this->assertSame(1, PersonaContratto::onlyTrashed()->count());
    }

    public function test_account_invito_impostazione_password_e_login(): void
    {
        $r = $this->postJson("/api/persone/{$this->dip->id}/account", ['email' => 'dario@example.ch', 'role' => 'educatore'])
            ->assertCreated()->assertJsonPath('account.invito_in_corso', true)->assertJsonPath('account.attivo', true);
        $link = $r->json('link_invito');
        $this->assertStringContainsString('/imposta-password?', $link);
        parse_str(parse_url($link, PHP_URL_QUERY), $q);

        $this->assertSame('dario@example.ch', $this->dip->fresh()->email);
        $this->postJson("/api/persone/{$this->dip->id}/account", ['email' => 'altra@example.ch', 'role' => 'educatore'])->assertStatus(422);

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => 'dario@example.ch', 'password' => 'qualunque12345'])->assertStatus(422);

        $this->postJson('/api/auth/imposta-password', ['email' => 'dario@example.ch', 'token' => 'sbagliato', 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99'])
            ->assertStatus(422)->assertJsonValidationErrors('token');
        $this->postJson('/api/auth/imposta-password', ['email' => 'dario@example.ch', 'token' => $q['token'], 'password' => 'corta', 'password_confirmation' => 'corta'])
            ->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/auth/imposta-password', ['email' => 'dario@example.ch', 'token' => $q['token'], 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99'])
            ->assertOk();
        $this->postJson('/api/auth/imposta-password', ['email' => 'dario@example.ch', 'token' => $q['token'], 'password' => 'AltraPassword99', 'password_confirmation' => 'AltraPassword99'])
            ->assertStatus(422);

        $this->postJson('/api/auth/login', ['email' => 'dario@example.ch', 'password' => 'NuovaPassword99'])->assertOk();
        $this->assertNotNull(User::where('email', 'dario@example.ch')->first()->ultimo_accesso_il);
        $this->assertDatabaseHas('audit_logs', ['action' => 'password_set']);
    }

    public function test_il_link_scaduto_non_funziona(): void
    {
        $r = $this->postJson("/api/persone/{$this->dip->id}/account", ['email' => 'dario@example.ch', 'role' => 'educatore'])->assertCreated();
        parse_str(parse_url($r->json('link_invito'), PHP_URL_QUERY), $q);
        User::where('email', 'dario@example.ch')->update(['invito_scade_il' => now()->subMinute()]);

        $this->postJson('/api/auth/imposta-password', ['email' => 'dario@example.ch', 'token' => $q['token'], 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99'])
            ->assertStatus(422);
        $this->getJson("/api/persone/{$this->dip->id}/account")->assertJsonPath('account.invito_scaduto', true);
    }

    public function test_disattivazione_reset_e_protezioni(): void
    {
        $this->postJson("/api/persone/{$this->dip->id}/account", ['email' => 'dario@example.ch', 'role' => 'educatore'])->assertCreated();
        $account = User::where('email', 'dario@example.ch')->first();
        $account->forceFill(['password' => 'Pass1234567890'])->save();
        $account->createToken('x');

        $this->patchJson("/api/persone/{$this->dip->id}/account", ['attivo' => false])->assertOk()->assertJsonPath('account.attivo', false);
        $this->assertSame(0, $account->tokens()->count());
        $this->postJson('/api/auth/login', ['email' => 'dario@example.ch', 'password' => 'Pass1234567890'])->assertStatus(422);

        $this->patchJson("/api/persone/{$this->dip->id}/account", ['attivo' => true])->assertOk();
        $this->postJson("/api/persone/{$this->dip->id}/account/reset")->assertOk()->assertJsonStructure(['link_invito']);
        $this->postJson('/api/auth/login', ['email' => 'dario@example.ch', 'password' => 'Pass1234567890'])->assertStatus(422);

        // un coordinatore non può dare ruoli alti né toccare il proprio account
        $coord = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore', 'email' => 'coord@example.ch']);
        Sanctum::actingAs($coord);
        $altro = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Anna']);
        $this->postJson("/api/persone/{$altro->id}/account", ['email' => 'anna@example.ch', 'role' => 'admin'])->assertForbidden();
        $this->postJson("/api/persone/{$altro->id}/account", ['email' => 'anna@example.ch', 'role' => 'educatore'])->assertCreated();

        $propria = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Coord']);
        $coord->forceFill(['persona_id' => $propria->id])->save();
        $this->patchJson("/api/persone/{$propria->id}/account", ['attivo' => false])->assertStatus(422);
    }

    public function test_l_ultimo_admin_attivo_non_si_disattiva(): void
    {
        // secondo admin collegato a una persona; il primo admin (actingAs) prova a disattivarlo mentre è l'unico altro admin
        $pAdmin = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Admin2']);
        $this->postJson("/api/persone/{$pAdmin->id}/account", ['email' => 'admin2@example.ch', 'role' => 'admin'])->assertCreated();
        $this->patchJson("/api/persone/{$pAdmin->id}/account", ['attivo' => false])->assertOk(); // c'è ancora $this->admin

        $this->admin->forceFill(['attivo' => false])->save();
        $this->patchJson("/api/persone/{$pAdmin->id}/account", ['attivo' => true])->assertOk();
        $this->patchJson("/api/persone/{$pAdmin->id}/account", ['role' => 'educatore'])->assertStatus(422);
    }

    public function test_educatori_non_gestiscono_account(): void
    {
        $educatore = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($educatore);
        $this->getJson("/api/persone/{$this->dip->id}/account")->assertForbidden();
        $this->postJson("/api/persone/{$this->dip->id}/account", ['email' => 'x@example.ch', 'role' => 'educatore'])->assertForbidden();
    }
}
