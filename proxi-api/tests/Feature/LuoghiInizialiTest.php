<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Luogo;
use App\Models\LuogoOrigine;
use App\Models\Servizio;
use App\Support\ImportaLuoghi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LuoghiInizialiTest extends TestCase
{
    use RefreshDatabase;

    private function migrazione()
    {
        return require database_path('migrations/2026_10_17_000001_importa_luoghi_iniziali.php');
    }

    public function test_il_file_dei_dati_e_valido_e_senza_colonne_di_audit(): void
    {
        $righe = ImportaLuoghi::leggi(database_path('data/luoghi_iniziali.csv'));
        $this->assertCount(148, $righe);
        $this->assertArrayNotHasKey('creato_da', $righe[0]);
        $this->assertArrayNotHasKey('modificato_da', $righe[0]);

        $ente = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        $this->assertSame([], ImportaLuoghi::analizza($ente->id, $righe, false)['errori']);
    }

    public function test_la_migrazione_importa_archivia_i_luoghi_di_prova_ed_e_ripetibile(): void
    {
        $ente = Institution::forceCreate(['name' => 'Associazione Prometheus', 'slug' => 'prometheus']);
        Luogo::forceCreate(['institution_id' => $ente->id, 'nome' => 'Prova 1', 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);
        Luogo::forceCreate(['institution_id' => $ente->id, 'nome' => 'Prova 2', 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);

        $this->migrazione()->up();

        $this->assertSame(148, Luogo::forInstitution($ente->id)->count());
        $this->assertSame(2, Luogo::forInstitution($ente->id)->onlyTrashed()->count());
        $this->assertSame(149, LuogoOrigine::where('institution_id', $ente->id)->count());     // compreso l'id fuso nel Centro Lüsc
        $this->assertTrue(Servizio::where('institution_id', $ente->id)->where('nome', 'like', 'Fondazione Amilcare')->exists());
        $this->assertSame('riservato', Luogo::where('nome', 'Casa Shira')->value('visibilita'));
        $this->assertTrue((bool) Luogo::where('nome', 'Midnight Agno')->value('servizio_id'));

        $this->migrazione()->up();                                                                // seconda volta: nessun doppione
        $this->assertSame(148, Luogo::forInstitution($ente->id)->count());
    }

    public function test_senza_ente_prometheus_non_fa_nulla_e_con_molti_luoghi_veri_non_li_archivia(): void
    {
        $this->migrazione()->up();
        $this->assertSame(0, Luogo::count());

        $ente = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus']);
        foreach (range(1, 12) as $i) {
            Luogo::forceCreate(['institution_id' => $ente->id, 'nome' => "Vero {$i}", 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);
        }
        $this->migrazione()->up();
        $this->assertSame(160, Luogo::forInstitution($ente->id)->count());          // 148 + 12 intatti
        $this->assertSame(0, Luogo::forInstitution($ente->id)->onlyTrashed()->count());
    }
}
