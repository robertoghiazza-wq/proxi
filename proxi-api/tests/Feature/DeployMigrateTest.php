<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeployMigrateTest extends TestCase
{
    use RefreshDatabase;

    private string $token = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEF';

    public function test_senza_token_configurato_l_endpoint_non_esiste(): void
    {
        config(['app.migrate_token' => null]);
        $this->get('/api/deploy/migrate?token=')->assertNotFound();
        $this->get('/api/deploy/migrate')->assertNotFound();
    }

    public function test_token_sbagliato_o_troppo_corto_e_404(): void
    {
        config(['app.migrate_token' => $this->token]);
        $this->get('/api/deploy/migrate?token=sbagliato')->assertNotFound();

        config(['app.migrate_token' => 'corto']);
        $this->get('/api/deploy/migrate?token=corto')->assertNotFound();
    }

    public function test_con_il_token_giusto_esegue_e_mostra_l_esito(): void
    {
        config(['app.migrate_token' => $this->token]);

        $this->get("/api/deploy/migrate?token={$this->token}")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
            ->assertSee('OK');

        $this->get("/api/deploy/migrate-status?token={$this->token}")
            ->assertOk()->assertSee('create_audit_logs_table')->assertSee('create_servizi_table');
    }
}
