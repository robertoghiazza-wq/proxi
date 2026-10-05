<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeployMigrateTest extends TestCase
{
    use RefreshDatabase;

    private function utente(string $ruolo): User
    {
        $inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p' . $ruolo]);

        return User::factory()->create([
            'institution_id' => $inst->id, 'role' => $ruolo, 'email' => "{$ruolo}@example.ch", 'password' => 'segreta123',
        ]);
    }

    public function test_la_pagina_mostra_il_modulo_di_accesso(): void
    {
        $this->get('/api/deploy/migrate')->assertOk()->assertSee('Migrazioni Proxi')->assertSee('type="password"', false);
    }

    public function test_senza_credenziali_valide_o_senza_ruolo_admin_e_negato(): void
    {
        $this->utente('educatore');
        $this->utente('coordinatore');

        $this->post('/api/deploy/migrate', ['email' => 'nessuno@example.ch', 'password' => 'x', 'azione' => 'esegui'])->assertForbidden();
        $this->post('/api/deploy/migrate', ['email' => 'educatore@example.ch', 'password' => 'sbagliata', 'azione' => 'esegui'])->assertForbidden();
        $this->post('/api/deploy/migrate', ['email' => 'educatore@example.ch', 'password' => 'segreta123', 'azione' => 'esegui'])
            ->assertForbidden()->assertDontSee('Esito');
        $this->post('/api/deploy/migrate', ['email' => 'coordinatore@example.ch', 'password' => 'segreta123', 'azione' => 'esegui'])
            ->assertForbidden();
    }

    public function test_un_admin_vede_stato_anteprima_ed_esegue(): void
    {
        $this->utente('admin');
        $dati = ['email' => 'admin@example.ch', 'password' => 'segreta123'];

        $this->post('/api/deploy/migrate', $dati + ['azione' => 'stato'])
            ->assertOk()->assertSee('create_servizi_table')->assertSee('scheda_persona_base');
        $this->post('/api/deploy/migrate', $dati + ['azione' => 'anteprima'])->assertOk()->assertSee('ANTEPRIMA');
        $this->post('/api/deploy/migrate', $dati + ['azione' => 'esegui'])->assertOk()->assertSee('OK');
    }

    public function test_l_output_e_sempre_escapato(): void
    {
        $this->post('/api/deploy/migrate', ['email' => '"><script>alert(1)</script>', 'password' => 'x'])
            ->assertForbidden()->assertDontSee('<script>alert(1)</script>', false);
    }

    public function test_diagnosi_ed_errori_solo_per_admin(): void
    {
        $this->utente('educatore');
        $this->utente('admin');
        $dati = ['email' => 'admin@example.ch', 'password' => 'segreta123'];

        $this->post('/api/deploy/migrate', ['email' => 'educatore@example.ch', 'password' => 'segreta123', 'azione' => 'diagnosi'])->assertForbidden();

        $this->post('/api/deploy/migrate', $dati + ['azione' => 'diagnosi'])
            ->assertOk()->assertSee('tabella persone')->assertSee('lista persone')->assertSee('lista ruoli')->assertDontSee('[ERRORE]');
        $this->post('/api/deploy/migrate', $dati + ['azione' => 'errori'])->assertOk();
    }
}
