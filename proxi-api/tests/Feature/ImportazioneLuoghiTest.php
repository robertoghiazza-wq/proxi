<?php

namespace Tests\Feature;

use App\Models\Evento;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\LuogoOrigine;
use App\Models\Servizio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ImportazioneLuoghiTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $admin;

    private const INTESTAZIONE = 'id_filemaker,nome,tipo,visibilita,punto_esatto,indirizzo,npa,localita,nazione,lat,lng,geo_qualita,comune_politico,bfs,cantone,orari,note,ente_riferimento,id_origine_unificati';

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'p']);
        $this->admin = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'admin']);
        Sanctum::actingAs($this->admin);
    }

    private function csv(array $righe): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('luoghi.csv', "\xEF\xBB\xBF".self::INTESTAZIONE."\n".implode("\n", $righe)."\n");
    }

    private function righe(): array
    {
        return [
            'AAA-1,Midnight Agno,centri_giovani,pubblico,parcheggio davanti alla palestra,Via Campagna,6982,Agno,Svizzera,46.0081,8.9068,manuale (da FileMaker),Agno,5002,TI,"Sabato sera, saltuario","Era un parcheggio",IdéeSport,',
            'BBB-2,Centro Lüsc,centri_giovani,pubblico,,Lüsc 6,6980,Croglio,Svizzera,45.99,8.83,ricostruita da OpenStreetMap (da controllare),Tresa,5398,TI,,,,CCC-3',
            'DDD-4,Casa privata,abitazioni_private,riservato,,,6987,Caslano,Svizzera,,,assente,,,,,,,',
            'EEE-5,Gold 20,commerci_ristorazione,pubblico,,Via Colombo 20,21037,Lavena Ponte Tresa,Italia,45.96,8.85,ricostruita da OpenStreetMap (estero),,,,,Ristorante sushi.,,',
        ];
    }

    public function test_anteprima_non_scrive_nulla(): void
    {
        $r = $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe())])->assertOk();
        $this->assertFalse($r->json('applicato'));
        $this->assertSame(4, $r->json('righe'));
        $this->assertSame(4, $r->json('nuovi'));
        $this->assertSame(['IdéeSport'], $r->json('servizi_nuovi'));
        $this->assertSame(3, $r->json('da_controllare'));
        $this->assertSame(0, Luogo::count());
        $this->assertSame(0, Servizio::count());
    }

    public function test_importa_collega_servizi_origini_e_segna_le_posizioni_da_controllare(): void
    {
        $r = $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe()), 'conferma' => 1])->assertOk();
        $this->assertTrue($r->json('applicato'));
        $this->assertCount(4, $r->json('mappa'));

        $midnight = Luogo::where('nome', 'Midnight Agno')->first();
        $this->assertSame('IdéeSport', $midnight->servizio->nome);
        $this->assertSame('parcheggio davanti alla palestra', $midnight->punto_esatto);
        $this->assertSame('Sabato sera, saltuario', $midnight->orari);
        $this->assertFalse($midnight->posizione_da_controllare);
        $this->assertSame(8.9068, $midnight->lng);

        $this->assertTrue(Luogo::where('nome', 'Centro Lüsc')->first()->posizione_da_controllare);
        $this->assertSame('riservato', Luogo::where('nome', 'Casa privata')->first()->visibilita);
        $this->assertNull(Luogo::where('nome', 'Casa privata')->first()->lat);
        $this->assertStringContainsString('Italia', Luogo::where('nome', 'Gold 20')->first()->note);

        // l'id fuso (CCC-3) porta allo stesso luogo di BBB-2
        $lusc = Luogo::where('nome', 'Centro Lüsc')->first();
        $this->assertSame($lusc->id, LuogoOrigine::where('id_origine', 'CCC-3')->value('luogo_id'));
        $this->assertSame($lusc->id, LuogoOrigine::where('id_origine', 'BBB-2')->value('luogo_id'));
        $this->assertSame(1, Servizio::count());
    }

    public function test_si_puo_ripetere_senza_doppioni(): void
    {
        $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe()), 'conferma' => 1])->assertOk();
        $righe = $this->righe();
        $righe[0] = str_replace('Midnight Agno', 'Midnight Agno (corretto)', $righe[0]);
        $r = $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($righe), 'conferma' => 1])->assertOk();

        $this->assertSame(0, $r->json('nuovi'));
        $this->assertSame(4, Luogo::count());
        $this->assertSame('Midnight Agno (corretto)', Luogo::where('nome', 'like', 'Midnight%')->first()->nome);
        $this->assertSame(1, Servizio::count());
    }

    public function test_sostituisci_archivia_i_luoghi_di_prova_e_segnala_gli_eventi(): void
    {
        $prova = Luogo::forceCreate(['institution_id' => $this->inst->id, 'nome' => 'Luogo di prova', 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);
        Luogo::forceCreate(['institution_id' => $this->inst->id, 'nome' => 'Altro test', 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);
        Evento::forceCreate(['institution_id' => $this->inst->id, 'educatore_id' => $this->admin->id, 'luogo_id' => $prova->id, 'tipo' => 'uscita', 'data' => '2026-08-05', 'durata_min' => 60, 'stato' => 'completato']);

        $anteprima = $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe()), 'sostituisci' => 1])->assertOk();
        $this->assertCount(2, $anteprima->json('da_archiviare'));
        $this->assertSame(1, collect($anteprima->json('da_archiviare'))->firstWhere('nome', 'Luogo di prova')['eventi']);
        $this->assertSame(2, Luogo::count());                         // l'anteprima non ha toccato nulla

        $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe()), 'sostituisci' => 1, 'conferma' => 1])->assertOk();
        $this->assertSame(4, Luogo::count());                          // restano solo i 4 importati
        $this->assertSame(6, Luogo::withTrashed()->count());           // gli altri sono archiviati, non persi
    }

    public function test_errori_e_permessi(): void
    {
        $righe = ['AAA-1,Senza tipo valido,tipo_inventato,pubblico,,,,,Svizzera,,,,,,,,,,'];
        $r = $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($righe), 'conferma' => 1])->assertOk();
        $this->assertFalse($r->json('applicato'));
        $this->assertStringContainsString('tipo_inventato', $r->json('errori.0'));
        $this->assertSame(0, Luogo::count());

        $senzaColonne = UploadedFile::fake()->createWithContent('x.csv', "a,b\n1,2\n");
        $this->postJson('/api/importazioni/luoghi', ['file' => $senzaColonne])->assertUnprocessable();

        $coord = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore']);
        Sanctum::actingAs($coord);
        $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe())])->assertForbidden();
    }

    public function test_modificare_la_posizione_toglie_il_segnale_da_controllare(): void
    {
        $this->postJson('/api/importazioni/luoghi', ['file' => $this->csv($this->righe()), 'conferma' => 1])->assertOk();
        $lusc = Luogo::where('nome', 'Centro Lüsc')->first();

        $this->patchJson("/api/luoghi/{$lusc->id}", ['note' => 'solo una nota', 'lat' => $lusc->lat, 'lng' => $lusc->lng, 'indirizzo' => $lusc->indirizzo])->assertOk();
        $this->assertTrue($lusc->fresh()->posizione_da_controllare);   // niente è cambiato nella posizione

        $this->patchJson("/api/luoghi/{$lusc->id}", ['lat' => 45.9901, 'lng' => 8.8301])->assertOk();
        $this->assertFalse($lusc->fresh()->posizione_da_controllare);
    }
}
