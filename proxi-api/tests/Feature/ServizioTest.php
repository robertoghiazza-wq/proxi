<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Institution;
use App\Models\Persona;
use App\Models\Servizio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServizioTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $inst = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        $this->user = User::factory()->create(['institution_id' => $inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($this->user);
    }

    private function persona(string $nome, ?int $inst = null): Persona
    {
        return Persona::create(['institution_id' => $inst ?? $this->user->institution_id, 'ruolo' => 'rete', 'nome' => $nome]);
    }

    public function test_crud_e_isolamento_tra_enti(): void
    {
        $this->postJson('/api/servizi', ['indirizzo' => 'Via X'])
            ->assertStatus(422)->assertJsonValidationErrors('nome');

        $id = $this->postJson('/api/servizi', [
            'nome' => 'Ufficio Famiglie e Giovani (UFaG)', 'indirizzo' => 'Viale Officine 6',
            'cap' => '6500', 'localita' => 'Bellinzona', 'lat' => 46.19, 'lng' => 9.02,
        ])->assertCreated()->assertJsonPath('paese', 'Svizzera')->json('id');

        $this->getJson('/api/servizi?q=bellinz')->assertOk()->assertJsonCount(1)->assertJsonPath('0.persone_count', 0);
        $this->patchJson("/api/servizi/{$id}", ['telefono' => '091 000 00 00'])->assertOk();
        $this->getJson("/api/servizi/{$id}")->assertOk()->assertJsonPath('telefono', '091 000 00 00');

        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Servizio::create(['institution_id' => $altro->id, 'nome' => 'Altrui']);
        $this->getJson("/api/servizi/{$estraneo->id}")->assertNotFound();
        $this->deleteJson("/api/servizi/{$estraneo->id}")->assertNotFound();
        $this->getJson('/api/servizi')->assertJsonCount(1);

        $this->deleteJson("/api/servizi/{$id}")->assertNoContent();
        $this->assertDatabaseHas('audit_logs', ['action' => 'deleted', 'auditable_type' => 'Servizio', 'auditable_id' => $id]);
    }

    public function test_contatti_con_ruolo_e_un_solo_principale(): void
    {
        $id = $this->postJson('/api/servizi', ['nome' => 'UFaG'])->json('id');
        $a = $this->persona('Marco Galli');
        $b = $this->persona('Guido De Angeli');

        $res = $this->putJson("/api/servizi/{$id}/persone", ['persone' => [
            ['persona_id' => $b->id, 'ruolo' => 'Referente UFaG', 'principale' => true],
            ['persona_id' => $a->id, 'ruolo' => ' Referente UFaG ', 'principale' => true],
        ]])->assertOk();

        $res->assertJsonCount(2, 'persone')
            ->assertJsonPath('persone.0.nome', 'Guido De Angeli')
            ->assertJsonPath('persone.0.pivot.principale', true)
            ->assertJsonPath('persone.1.pivot.principale', false)
            ->assertJsonPath('persone.1.pivot.ruolo', 'Referente UFaG');

        $this->assertDatabaseHas('audit_logs', ['action' => 'updated', 'auditable_type' => 'Servizio', 'auditable_id' => $id]);

        $this->getJson("/api/persone/{$a->id}")->assertJsonPath('servizi.0.nome', 'UFaG');

        $this->putJson("/api/servizi/{$id}/persone", ['persone' => []])->assertOk()->assertJsonCount(0, 'persone');
    }

    public function test_non_si_collegano_persone_di_altri_enti_o_doppioni(): void
    {
        $id = $this->postJson('/api/servizi', ['nome' => 'UFaG'])->json('id');
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estranea = $this->persona('Estranea', $altro->id);
        $mia = $this->persona('Mia');

        $this->putJson("/api/servizi/{$id}/persone", ['persone' => [['persona_id' => $estranea->id]]])
            ->assertStatus(422)->assertJsonValidationErrors('persone.0.persona_id');

        $this->putJson("/api/servizi/{$id}/persone", ['persone' => [
            ['persona_id' => $mia->id], ['persona_id' => $mia->id],
        ]])->assertStatus(422);
    }
}
