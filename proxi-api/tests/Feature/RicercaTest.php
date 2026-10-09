<?php

namespace Tests\Feature;

use App\Models\Evento;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\PersonaDiario;
use App\Models\Servizio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RicercaTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $inst;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus'])->id;
        $this->user = User::factory()->create(['institution_id' => $this->inst, 'role' => 'educatore']);
        Sanctum::actingAs($this->user);
    }

    private function cerca(string $ambito, string $q)
    {
        return $this->getJson('/api/ricerca?'.http_build_query(['ambito' => $ambito, 'q' => $q]))->assertOk();
    }

    public function test_persone_trova_nel_diario_senza_mostrare_il_testo_e_ignora_accenti(): void
    {
        $anna = Persona::create(['institution_id' => $this->inst, 'ruolo' => 'utente', 'nome' => 'Anna', 'cognome' => 'Rossi', 'tag' => ['città'], 'note' => 'Segreto granchio']);
        $luca = Persona::create(['institution_id' => $this->inst, 'ruolo' => 'utente', 'nome' => 'Luca']);
        PersonaDiario::create(['institution_id' => $this->inst, 'persona_id' => $luca->id, 'data' => '2026-01-10', 'nota' => 'Ha parlato del suo cane Fuffi', 'autore_id' => $this->user->id]);

        $r = $this->cerca('persone', 'fuffi')->assertJsonCount(1)->assertJsonPath('0.id', $luca->id)->assertJsonPath('0.trovato.0.campo', 'Diario');
        $this->assertNull($r->json('0.trovato.0.estratto'));                       // il testo del diario non esce nell'elenco

        $this->cerca('persone', 'citta')->assertJsonCount(1)->assertJsonPath('0.id', $anna->id)->assertJsonPath('0.trovato.0.campo', 'Tag');
        $r = $this->cerca('persone', 'granchio')->assertJsonCount(1);
        $this->assertNull($r->json('0.trovato.0.estratto'));                       // nemmeno le note
        $this->cerca('persone', 'rossi anna')->assertJsonCount(1);                 // più parole: tutte presenti
        $this->cerca('persone', 'rossi fuffi')->assertJsonCount(0);
    }

    public function test_ogni_sezione_cerca_nei_propri_contenuti_e_gli_eventi_anche_in_luoghi_e_persone(): void
    {
        $luogo = Luogo::create(['institution_id' => $this->inst, 'nome' => 'Parco Ciani', 'tipo' => 'parchi_piazze_sport', 'localita' => 'Lugano', 'attivo' => true]);
        $altro = Luogo::create(['institution_id' => $this->inst, 'nome' => 'Lidl', 'tipo' => 'commerci_ristorazione', 'attivo' => true]);
        $marco = Persona::create(['institution_id' => $this->inst, 'ruolo' => 'utente', 'nome' => 'Marco', 'soprannome' => 'Bomber']);
        $evento = Evento::forceCreate(['institution_id' => $this->inst, 'educatore_id' => $this->user->id, 'luogo_id' => $luogo->id, 'tipo' => 'uscita', 'data' => '2026-10-05',
            'ora_inizio' => '14:00', 'durata_min' => 60, 'stato' => 'completato', 'note' => 'Chiacchierata sul pallone']);
        DB::table('evento_persona')->insert(['evento_id' => $evento->id, 'persona_id' => $marco->id]);

        // eventi: per luogo, persona, nota, data, mese
        foreach (['ciani', 'bomber', 'pallone', '5.10.2026', 'ottobre', '2026-10'] as $q) {
            $this->cerca('eventi', $q)->assertJsonCount(1)->assertJsonPath('0.id', $evento->id);
        }
        $this->cerca('eventi', 'novembre')->assertJsonCount(0);
        $this->cerca('eventi', 'ciani bomber')->assertJsonCount(1);

        // luoghi: solo i contenuti del luogo, non le note degli eventi né le persone
        $this->cerca('luoghi', 'ciani')->assertJsonCount(1)->assertJsonPath('0.id', $luogo->id);
        $this->cerca('luoghi', 'pallone')->assertJsonCount(0);
        $this->cerca('luoghi', 'bomber')->assertJsonCount(0);
        // persone: non cerca negli eventi
        $this->cerca('persone', 'pallone')->assertJsonCount(0);
        $this->cerca('persone', 'ciani')->assertJsonCount(0);
    }

    public function test_servizi_con_persone_collegate_e_persone_con_il_servizio(): void
    {
        $s = Servizio::create(['institution_id' => $this->inst, 'nome' => 'SMP', 'localita' => 'Viganello']);
        $p = Persona::create(['institution_id' => $this->inst, 'ruolo' => 'rete', 'nome' => 'Chiara', 'cognome' => 'Armati']);
        DB::table('persona_servizio')->insert(['persona_id' => $p->id, 'servizio_id' => $s->id, 'ruolo' => 'Psicologa', 'principale' => true]);

        $this->cerca('servizi', 'armati')->assertJsonCount(1)->assertJsonPath('0.id', $s->id)->assertJsonPath('0.trovato.0.campo', 'Persone');
        $this->cerca('servizi', 'viganello')->assertJsonCount(1);
        $this->cerca('persone', 'smp')->assertJsonCount(1)->assertJsonPath('0.id', $p->id)->assertJsonPath('0.trovato.0.campo', 'Servizio');
    }

    public function test_isolamento_tra_enti_e_validazione(): void
    {
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'altro'])->id;
        Persona::create(['institution_id' => $altro, 'ruolo' => 'utente', 'nome' => 'Zorro']);

        $this->cerca('persone', 'zorro')->assertJsonCount(0);
        $this->getJson('/api/ricerca?ambito=boh&q=ab')->assertStatus(422);
        $this->getJson('/api/ricerca?ambito=persone&q=a')->assertStatus(422);
    }
}
