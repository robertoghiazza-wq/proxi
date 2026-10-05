<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CambiaPasswordTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p']);
        $this->user = User::factory()->create(['institution_id' => $inst->id, 'email' => 'a@example.ch', 'password' => 'VecchiaPass1']);
    }

    private function accedi(): string
    {
        return $this->postJson('/api/auth/login', ['email' => 'a@example.ch', 'password' => 'VecchiaPass1'])->assertOk()->json('token');
    }

    private function cambia(string $token, array $dati)
    {
        return $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/auth/password', $dati);
    }

    public function test_cambio_riuscito_scollega_gli_altri_dispositivi_e_finisce_nel_log(): void
    {
        $telefono = $this->accedi();
        $pc = $this->accedi();

        $this->cambia($pc, [
            'current_password' => 'VecchiaPass1', 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99',
        ])->assertOk();

        $this->assertTrue(Hash::check('NuovaPassword99', $this->user->fresh()->password));
        $this->assertDatabaseHas('audit_logs', ['action' => 'password_changed', 'auditable_type' => 'User', 'auditable_id' => $this->user->id]);
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$telefono}")->getJson('/api/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$pc}")->getJson('/api/me')->assertOk();

        $this->postJson('/api/auth/login', ['email' => 'a@example.ch', 'password' => 'NuovaPassword99'])->assertOk();
    }

    public function test_password_attuale_sbagliata_non_scollega_e_non_cambia(): void
    {
        $t = $this->accedi();

        $this->cambia($t, [
            'current_password' => 'Sbagliata123', 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('VecchiaPass1', $this->user->fresh()->password));
        $this->assertDatabaseMissing('audit_logs', ['action' => 'password_changed']);
    }

    public function test_regole_sulla_nuova_password(): void
    {
        $t = $this->accedi();
        $base = ['current_password' => 'VecchiaPass1'];

        $this->cambia($t, $base + ['password' => 'Corta1', 'password_confirmation' => 'Corta1'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->cambia($t, $base + ['password' => 'SoloLettereLunghe', 'password_confirmation' => 'SoloLettereLunghe'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->cambia($t, $base + ['password' => 'NuovaPassword99', 'password_confirmation' => 'Diversa123456'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->cambia($t, $base + ['password' => 'VecchiaPass1', 'password_confirmation' => 'VecchiaPass1'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_serve_essere_collegati(): void
    {
        $this->postJson('/api/auth/password', [
            'current_password' => 'VecchiaPass1', 'password' => 'NuovaPassword99', 'password_confirmation' => 'NuovaPassword99',
        ])->assertUnauthorized();
    }
}
