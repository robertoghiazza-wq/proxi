<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Evento;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TipiEnteTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $admin;
    private User $coord;
    private User $educatore;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->inst = Institution::forceCreate(['name' => 'Associazione Prometheus', 'slug' => 'p']);
        $this->admin = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'admin']);
        $this->coord = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore']);
        $this->educatore = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($this->educatore);
    }

    public function test_un_nuovo_ente_riceve_categorie_tipi_e_tipi_di_luogo_di_partenza(): void
    {
        $r = $this->getJson('/api/tipi')->assertOk();
        $this->assertCount(5, $r->json('categorie'));
        $this->assertCount(22, $r->json('tipi_evento'));
        $this->assertCount(5, $r->json('tipi_luogo'));
        $this->assertContains('arancio', $r->json('colori'));
        $this->assertSame('uscita', $r->json('tipi_evento.0.chiave'));
    }

    public function test_solo_i_gestori_modificano_i_tipi(): void
    {
        $this->postJson('/api/tipi-luogo', ['nome' => 'Parco', 'colore' => 'verde'])->assertForbidden();

        Sanctum::actingAs($this->coord);
        $id = $this->postJson('/api/tipi-luogo', ['nome' => 'Parco giochi', 'colore' => 'verde'])->assertCreated()->assertJsonPath('chiave', 'parco_giochi')->json('id');
        $this->patchJson("/api/tipi-luogo/{$id}", ['colore' => 'rosa', 'nome' => 'Parco'])->assertOk()->assertJsonPath('colore', 'rosa')->assertJsonPath('chiave', 'parco_giochi');
        $this->postJson('/api/tipi-luogo', ['nome' => 'X', 'colore' => 'fucsia'])->assertUnprocessable();
        $this->deleteJson("/api/tipi-luogo/{$id}")->assertNoContent();
    }

    public function test_tipo_usato_non_si_elimina_ma_si_disattiva(): void
    {
        Sanctum::actingAs($this->coord);
        $strada = collect($this->getJson('/api/tipi')->json('tipi_luogo'))->firstWhere('chiave', 'strada');
        Luogo::forceCreate(['institution_id' => $this->inst->id, 'nome' => 'Piazza', 'tipo' => 'strada', 'attivo' => true]);

        $this->deleteJson("/api/tipi-luogo/{$strada['id']}")->assertUnprocessable();
        $this->patchJson("/api/tipi-luogo/{$strada['id']}", ['attivo' => false])->assertOk()->assertJsonPath('attivo', false);
        $this->assertSame(1, collect($this->getJson('/api/tipi')->json('tipi_luogo'))->firstWhere('chiave', 'strada')['usi']);
    }

    public function test_categorie_e_tipi_di_evento(): void
    {
        Sanctum::actingAs($this->coord);
        $cat = $this->postJson('/api/categorie-evento', ['nome' => 'Scuola', 'colore' => 'blu'])->assertCreated()->json('id');
        $tipo = $this->postJson('/api/tipi-evento', ['nome' => 'Intervento in classe', 'categoria_id' => $cat])->assertCreated()->json();
        $this->assertNull($tipo['colore']);
        $this->assertSame('intervento_in_classe', $tipo['chiave']);

        // la categoria con tipi non si elimina
        $this->deleteJson("/api/categorie-evento/{$cat}")->assertUnprocessable();

        // un evento che usa il tipo ne blocca l'eliminazione
        Evento::forceCreate(['institution_id' => $this->inst->id, 'educatore_id' => $this->coord->id, 'tipo' => 'intervento_in_classe', 'data' => '2026-10-01', 'durata_min' => 30, 'stato' => 'completato']);
        $this->deleteJson("/api/tipi-evento/{$tipo['id']}")->assertUnprocessable();

        // categoria di un altro ente: non valida
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'a']);
        $catAltro = \App\Models\CategoriaEvento::where('institution_id', $altro->id)->first();
        $this->postJson('/api/tipi-evento', ['nome' => 'Z', 'categoria_id' => $catAltro->id])->assertUnprocessable();
    }

    public function test_il_luogo_accetta_solo_tipi_configurati_dell_ente(): void
    {
        Sanctum::actingAs($this->coord);
        $this->postJson('/api/luoghi', ['nome' => 'A', 'tipo' => 'strada', 'attivo' => true])->assertStatus(201);
        $this->postJson('/api/luoghi', ['nome' => 'B', 'tipo' => 'inventato'])->assertUnprocessable();
        $id = $this->postJson('/api/tipi-luogo', ['nome' => 'Parco', 'colore' => 'lime'])->json('chiave');
        $this->postJson('/api/luoghi', ['nome' => 'C', 'tipo' => $id])->assertStatus(201);
    }

    public function test_brand_solo_admin_colore_nome_e_logo(): void
    {
        Sanctum::actingAs($this->coord);
        $this->putJson('/api/ente', ['accent_color' => '#0a7d6f'])->assertForbidden();
        $this->postJson('/api/ente/logo', ['logo' => UploadedFile::fake()->image('l.png')])->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->putJson('/api/ente', ['accent_color' => 'rosso'])->assertUnprocessable();
        $this->putJson('/api/ente', ['accent_color' => '#0A7D6F', 'name' => 'Ingrado'])->assertOk()
            ->assertJsonPath('accent_color', '#0a7d6f')->assertJsonPath('name', 'Ingrado');

        $this->postJson('/api/ente/logo', ['logo' => UploadedFile::fake()->image('l.png', 200, 200)])->assertOk()
            ->assertJsonPath('ha_logo', true)->assertJsonMissingPath('logo_path');
        $this->get('/api/ente/logo')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertTrue(AuditLog::where('auditable_type', 'Institution')->where('meta->campo', 'logo')->exists());

        // anche gli altri utenti dell'ente vedono il logo e il colore (arrivano da /me)
        Sanctum::actingAs($this->educatore);
        $me = $this->getJson('/api/me')->assertOk();
        $this->assertSame('#0a7d6f', $me->json('institution.accent_color'));
        $this->assertTrue($me->json('institution.ha_logo'));
        $this->get('/api/ente/logo')->assertOk();

        Sanctum::actingAs($this->admin);
        $this->deleteJson('/api/ente/logo')->assertOk()->assertJsonPath('ha_logo', false);
        $this->get('/api/ente/logo')->assertNotFound();
        $this->assertCount(0, Storage::disk('local')->allFiles());
    }

    public function test_logo_svg_con_script_e_rifiutato(): void
    {
        Sanctum::actingAs($this->admin);
        $cattivo = UploadedFile::fake()->createWithContent('l.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->postJson('/api/ente/logo', ['logo' => $cattivo])->assertUnprocessable();
        $buono = UploadedFile::fake()->createWithContent('l.svg', '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>');
        $this->postJson('/api/ente/logo', ['logo' => $buono])->assertOk();
    }
}
