<?php

namespace Tests\Feature;

use App\Models\Evento;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\User;
use App\Support\ConteggioOre;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConteggioOreTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $admin;
    private User $account;
    private Persona $dip;
    private Luogo $luogo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'P', 'slug' => 'p']);
        $this->admin = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'admin']);
        $this->dip = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Dario', 'cognome' => 'Marsilio']);
        $this->account = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        $this->account->forceFill(['persona_id' => $this->dip->id])->save();
        $this->luogo = Luogo::create(['institution_id' => $this->inst->id, 'nome' => 'Stazione', 'tipo' => 'strada']);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/persone/{$this->dip->id}/contratti", [
            'data_inizio' => '2025-01-01', 'grado' => 60, 'ore_settimanali' => 24,
        ])->assertCreated();
    }

    private function evento(string $data, int $minuti, string $stato = 'completato', ?int $educatore = null): Evento
    {
        return Evento::create([
            'institution_id' => $this->inst->id, 'educatore_id' => $educatore ?? $this->account->id, 'luogo_id' => $this->luogo->id,
            'tipo' => 'uscita', 'data' => $data, 'ora_inizio' => '10:00', 'durata_min' => $minuti, 'stato' => $stato,
        ]);
    }

    public function test_le_settimane_appartengono_al_mese_del_loro_giovedi(): void
    {
        $ago = array_map(fn ($d) => $d->toDateString(), ConteggioOre::lunedi(2026, 8));
        $this->assertSame(['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24'], $ago);

        $lug = array_map(fn ($d) => $d->toDateString(), ConteggioOre::lunedi(2026, 7));
        $this->assertSame(['2026-06-29', '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27'], $lug);

        // ogni settimana è in un solo mese, in tutto l'anno
        $tutte = [];
        foreach (range(1, 12) as $m) {
            foreach (ConteggioOre::lunedi(2026, $m) as $l) {
                $tutte[] = $l->toDateString();
            }
        }
        $this->assertSame($tutte, array_values(array_unique($tutte)));
        $this->assertCount(53, $tutte); // il 2026 comincia di giovedì: 53 settimane ISO
    }

    public function test_agosto_2026_riproduce_i_numeri_di_filemaker(): void
    {
        foreach ([300, 315, 345, 390, 300, 375, 195, 600, 390] as $i => $min) {
            $giorno = CarbonImmutable::create(2026, 8, 4)->addDays($i * 2 + ($i > 2 ? 1 : 0))->toDateString();
            $this->evento($giorno, $min);
        }
        $this->evento('2026-08-01', 600);          // sabato: settimana del 27 luglio → luglio
        $this->evento('2026-08-31', 600);          // lunedì: settimana del 31 agosto → settembre
        $this->evento('2026-08-12', 240, 'pianificato');   // non svolto: non conta

        $this->putJson("/api/ore/{$this->dip->id}/mese", ['anno' => 2026, 'mese' => 8, 'vacanze_giorni' => 7])
            ->assertOk()
            ->assertJsonCount(4, 'settimane')
            ->assertJsonPath('totali.dovute', 96)
            ->assertJsonPath('totali.lavorate', 53.5)
            ->assertJsonPath('totali.vacanze_ore', 33.6)
            ->assertJsonPath('totali.saldo', -8.9)
            ->assertJsonPath('ore_giornaliere', 4.8);
    }

    public function test_correzione_festivi_e_ore_dal_grado(): void
    {
        $this->evento('2026-09-08', 120);
        $this->putJson("/api/ore/{$this->dip->id}/mese", [
            'anno' => 2026, 'mese' => 9, 'festivi_giorni' => 1, 'correzione_ore' => -2.5, 'nota' => 'Recupero',
        ])->assertOk()
            ->assertJsonPath('totali.festivi_ore', 4.8)
            ->assertJsonPath('totali.correzione', -2.5)
            ->assertJsonPath('voce.nota', 'Recupero');

        // senza "ore settimanali" si usa grado × ore a tempo pieno (60% di 40 h = 24 h)
        $this->postJson("/api/persone/{$this->dip->id}/contratti", ['data_inizio' => '2027-01-01', 'grado' => 50])->assertCreated();
        $this->getJson("/api/ore/{$this->dip->id}?anno=2027&mese=2")->assertJsonPath('totali.dovute', 80);   // 4 settimane × 20 h
    }

    public function test_conta_anche_chi_partecipa_senza_doppioni(): void
    {
        $altro = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        $riunione = $this->evento('2026-10-06', 90, 'completato', $altro->id);   // creata da un collega
        $riunione->persone()->sync([$this->dip->id]);
        $propria = $this->evento('2026-10-07', 60);                               // creata dal dipendente
        $propria->persone()->sync([$this->dip->id]);                              // e lo elenca anche tra le persone

        $this->getJson("/api/ore/{$this->dip->id}?anno=2026&mese=10")->assertOk()->assertJsonPath('totali.lavorate', 2.5);
    }

    public function test_senza_contratto_le_ore_dovute_sono_zero_e_lo_segnala(): void
    {
        $senza = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Anna']);
        $this->getJson("/api/ore/{$senza->id}?anno=2026&mese=8")->assertOk()
            ->assertJsonPath('contratto_mancante', true)->assertJsonPath('totali.dovute', 0);
    }

    public function test_report_annuale(): void
    {
        $this->evento('2026-03-10', 600);
        $r = $this->getJson("/api/ore/{$this->dip->id}/anno?anno=2026")->assertOk()->assertJsonCount(12, 'mesi');
        $this->assertSame(10.0, (float) $r->json('mesi.2.totali.lavorate'));
        $this->assertSame(round(array_sum(array_column(array_column($r->json('mesi'), 'totali'), 'saldo')), 2), (float) $r->json('saldo_annuo'));
    }

    public function test_permessi(): void
    {
        // il dipendente vede le proprie ore (anche con "me") ma non quelle altrui né può correggere
        Sanctum::actingAs($this->account);
        $this->getJson('/api/ore/me?anno=2026&mese=8')->assertOk();
        $this->getJson("/api/ore/{$this->dip->id}?anno=2026&mese=8")->assertOk();
        $this->putJson("/api/ore/{$this->dip->id}/mese", ['anno' => 2026, 'mese' => 8, 'vacanze_giorni' => 3])->assertForbidden();

        $altra = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'dipendente', 'nome' => 'Anna']);
        $this->getJson("/api/ore/{$altra->id}?anno=2026&mese=8")->assertForbidden();

        // un account non collegato a una scheda dipendente non ha "me"
        $libero = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore']);
        Sanctum::actingAs($libero);
        $this->getJson('/api/ore/me')->assertStatus(422);

        // altri enti e persone non dipendenti: 404
        Sanctum::actingAs($this->admin);
        $utente = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'U']);
        $this->getJson("/api/ore/{$utente->id}")->assertNotFound();
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro']);
        $estraneo = Persona::create(['institution_id' => $altro->id, 'ruolo' => 'dipendente', 'nome' => 'X']);
        $this->getJson("/api/ore/{$estraneo->id}")->assertNotFound();
    }

    public function test_la_correzione_e_registrata_nel_log(): void
    {
        $this->putJson("/api/ore/{$this->dip->id}/mese", ['anno' => 2026, 'mese' => 8, 'correzione_ore' => 3])->assertOk();
        $this->putJson("/api/ore/{$this->dip->id}/mese", ['anno' => 2026, 'mese' => 8, 'correzione_ore' => 5])->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action' => 'created', 'auditable_type' => 'OreMensile']);
        $log = \App\Models\AuditLog::where('auditable_type', 'OreMensile')->where('action', 'updated')->firstOrFail();
        $this->assertEquals(3, $log->old_values['correzione_ore']);
        $this->assertEquals(5, $log->new_values['correzione_ore']);
    }
}
