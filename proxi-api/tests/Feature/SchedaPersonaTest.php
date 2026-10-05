<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\Ruolo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SchedaPersonaTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Institution $inst;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        $this->user = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($this->user);
    }

    public function test_i_ruoli_predefiniti_sono_creati_con_l_ente(): void
    {
        $r = $this->getJson('/api/ruoli')->assertOk();
        $this->assertGreaterThan(40, count($r->json()));

        $educatore = collect($r->json())->firstWhere('nome_m', 'Educatore');
        $this->assertSame('Educatrice', $educatore['nome_f']);
        $this->assertSame('Educatore/trice', $educatore['nome_misto']);

        $this->assertNotNull(collect($r->json())->firstWhere('nome_m', 'Comandante di polizia'));
        $this->assertNull(collect($r->json())->firstWhere('nome_m', 'Presidente')['nome_f']);
    }

    public function test_solo_i_gestori_modificano_i_ruoli_e_ognuno_vede_solo_i_suoi(): void
    {
        $this->postJson('/api/ruoli', ['nome_m' => 'Tutor'])->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore']));
        $id = $this->postJson('/api/ruoli', ['nome_m' => 'Tutor', 'nome_f' => 'Tutor'])->assertCreated()->json('id');
        $this->patchJson("/api/ruoli/{$id}", ['nome_f' => 'Tutora'])->assertOk()->assertJsonPath('nome_f', 'Tutora');

        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Ruolo::forInstitution($altro->id)->first();
        $this->patchJson("/api/ruoli/{$estraneo->id}", ['nome_m' => 'X'])->assertNotFound();

        $this->deleteJson("/api/ruoli/{$id}")->assertNoContent();
    }

    public function test_scheda_completa_con_telefoni_indirizzo_ed_eta_calcolata(): void
    {
        $ruolo = Ruolo::forInstitution($this->inst->id)->where('nome_m', 'Educatore')->first();

        $res = $this->postJson('/api/persone', [
            'ruolo' => 'dipendente', 'ruolo_id' => $ruolo->id, 'nome' => 'Dario', 'cognome' => 'Marsilio',
            'sesso' => 'M', 'data_nascita' => now()->subYears(31)->subDays(10)->toDateString(),
            'email' => 'dario@example.ch', 'indirizzo' => 'Via Ferri 1', 'npa' => '6900',
            'localita' => 'Lugano', 'comune_politico' => 'Lugano', 'bfs' => '5192', 'cantone' => 'TI',
            'telefoni' => [['etichetta' => 'Natel', 'numero' => '079 000 00 00'], ['etichetta' => 'Casa', 'numero' => '091 111 11 11']],
        ])->assertCreated();

        $res->assertJsonPath('eta', 31)->assertJsonPath('telefono', '079 000 00 00')
            ->assertJsonCount(2, 'telefoni')->assertJsonPath('telefoni.1.etichetta', 'Casa');

        $id = $res->json('id');
        $this->getJson("/api/persone/{$id}")->assertJsonPath('comune_politico', 'Lugano')->assertJsonPath('cantone', 'TI');

        $this->patchJson("/api/persone/{$id}", ['telefoni' => [['numero' => '078 222 22 22']]])
            ->assertJsonCount(1, 'telefoni')->assertJsonPath('telefono', '078 222 22 22');

        $this->assertDatabaseHas('audit_logs', ['auditable_type' => 'Persona', 'auditable_id' => $id, 'action' => 'updated']);
    }

    public function test_validazioni_ruolo_data_e_cantone(): void
    {
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Ruolo::forInstitution($altro->id)->first();

        $this->postJson('/api/persone', ['nome' => 'A', 'ruolo_id' => $estraneo->id])
            ->assertStatus(422)->assertJsonValidationErrors('ruolo_id');
        $this->postJson('/api/persone', ['nome' => 'A', 'data_nascita' => now()->addDay()->toDateString()])
            ->assertStatus(422)->assertJsonValidationErrors('data_nascita');
        $this->postJson('/api/persone', ['nome' => 'A', 'cantone' => 'Ticino'])
            ->assertStatus(422)->assertJsonValidationErrors('cantone');
        $this->postJson('/api/persone', ['cognome' => 'Solo'])->assertCreated();
    }

    public function test_comune_e_cantone_su_luoghi_e_servizi(): void
    {
        $l = $this->postJson('/api/luoghi', [
            'nome' => 'Piazza', 'tipo' => 'strada', 'indirizzo' => 'Piazza Riforma 1', 'npa' => '6900',
            'localita' => 'Lugano', 'comune_politico' => 'Lugano', 'bfs' => '5192', 'cantone' => 'TI',
        ])->assertCreated()->assertJsonPath('comune_politico', 'Lugano')->assertJsonPath('cantone', 'TI');

        $this->postJson('/api/servizi', ['nome' => 'UFaG', 'comune_politico' => 'Bellinzona', 'cantone' => 'TI'])
            ->assertCreated()->assertJsonPath('cantone', 'TI');
    }
}
