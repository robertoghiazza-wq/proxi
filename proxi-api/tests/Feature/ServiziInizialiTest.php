<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Servizio;
use App\Models\ServizioOrigine;
use App\Support\ImportaLuoghi;
use App\Support\ImportaServizi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiziInizialiTest extends TestCase
{
    use RefreshDatabase;

    private function migrazione(string $nome)
    {
        return require database_path("migrations/{$nome}.php");
    }

    public function test_dopo_i_luoghi_i_servizi_si_completano_senza_doppioni(): void
    {
        $ente = Institution::forceCreate(['name' => 'Associazione Prometheus', 'slug' => 'prometheus']);
        $this->migrazione('2026_10_17_000001_importa_luoghi_iniziali')->up();
        $creatiDaiLuoghi = Servizio::forInstitution($ente->id)->count();
        $this->assertTrue(Servizio::where('nome', 'Servizio Psico-Sociale (SPS)')->exists());   // stesso nome del file dei servizi

        $this->migrazione('2026_10_19_000002_importa_servizi_iniziali')->up();

        $righe = ImportaLuoghi::leggi(database_path('data/servizi_iniziali.csv'));
        $this->assertCount(35, $righe);
        $this->assertSame(1, Servizio::where('nome', 'like', '%(SMP)')->count());
        $this->assertSame(1, Servizio::where('nome', 'like', '%(UFaG)')->count());
        $this->assertSame(1, Servizio::where('nome', 'like', '%SOS-debiti%')->count());
        $this->assertGreaterThan($creatiDaiLuoghi, Servizio::forInstitution($ente->id)->count());
        $this->assertSame(41, Servizio::forInstitution($ente->id)->count());   // 35 del file + 6 enti presenti solo nei luoghi

        $smp = Servizio::where('nome', 'like', '%(SMP)')->first();
        $this->assertSame('Via Luganetto 5', $smp->indirizzo);
        $this->assertSame('Lugano', $smp->comune_politico);
        $this->assertNotNull($smp->lat);
        $this->assertGreaterThan(0, \App\Models\Luogo::where('servizio_id', $smp->id)->count());   // i luoghi restano collegati
    }

    public function test_i_due_id_della_polizia_puntano_allo_stesso_servizio_ed_e_ripetibile(): void
    {
        $ente = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        $righe = ImportaLuoghi::leggi(database_path('data/servizi_iniziali.csv'));
        ImportaServizi::applica($ente->id, $righe);

        $polizia = Servizio::where('nome', 'Polizia di prossimità Malcantone Est')->first();
        $this->assertSame(2, ServizioOrigine::where('servizio_id', $polizia->id)->count());
        $this->assertSame(36, ServizioOrigine::where('institution_id', $ente->id)->count());   // 35 servizi + 1 id fuso

        $polizia->update(['telefono' => '091 000 00 00']);
        ImportaServizi::applica($ente->id, $righe);                                           // seconda volta
        $this->assertSame(35, Servizio::forInstitution($ente->id)->count());
        $this->assertSame('091 000 00 00', $polizia->fresh()->telefono);                      // modifiche a mano conservate
    }
}
