<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Persona;
use App\Models\Servizio;
use App\Support\Telefono;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NumeriInternazionaliTest extends TestCase
{
    use RefreshDatabase;

    public function test_formati(): void
    {
        $casi = [
            '079 123 45 67'      => '+41 79 123 45 67',
            '0791234567'         => '+41 79 123 45 67',
            '091/966.00.91'      => '+41 91 966 00 91',
            '+41 91 630 27 51'   => '+41 91 630 27 51',
            '+41791234567'       => '+41 79 123 45 67',
            '0041 79 123 45 67'  => '+41 79 123 45 67',
            '+41 (0)79 123 45 67' => '+41 79 123 45 67',
            '+39 333 123 4567'   => '+39 333 123 4567',
            '0039 3331234567'    => '+39 333 123 4567',
            '+49 151 23456789'   => '+49 151 23456789',
        ];
        foreach ($casi as $in => $atteso) $this->assertSame($atteso, Telefono::internazionale($in), $in);

        foreach (['', null, 'int. 12', '091 123 45 67 oppure 079 1', '123', '91 123 45 67'] as $non) {
            $this->assertNull(Telefono::internazionale($non), (string) $non);   // non riconoscibile: resta com'è
        }
    }

    public function test_la_migrazione_aggiorna_persone_telefoni_e_servizi_ed_e_ripetibile(): void
    {
        $ente = Institution::forceCreate(['name' => 'Prometheus', 'slug' => 'prometheus'])->id;
        $p = Persona::create(['institution_id' => $ente, 'ruolo' => 'utente', 'nome' => 'Anna', 'telefono' => '079 123 45 67']);
        DB::table('persona_telefoni')->insert(['persona_id' => $p->id, 'etichetta' => 'Casa', 'numero' => '091 966 00 91', 'ordine' => 0]);
        DB::table('persona_telefoni')->insert(['persona_id' => $p->id, 'etichetta' => 'Altro', 'numero' => 'chiedere a mamma', 'ordine' => 1]);
        $s = Servizio::create(['institution_id' => $ente, 'nome' => 'SMP', 'telefono' => '+41 91 630 27 51']);
        $s2 = Servizio::create(['institution_id' => $ente, 'nome' => 'ATFA', 'telefono' => '091 966 00 91']);

        $m = require database_path('migrations/2026_10_20_000001_numeri_internazionali.php');
        $m->up();
        $m->up();

        $this->assertSame('+41 79 123 45 67', $p->fresh()->telefono);
        $this->assertSame(['+41 91 966 00 91', 'chiedere a mamma'], DB::table('persona_telefoni')->orderBy('ordine')->pluck('numero')->all());
        $this->assertSame('+41 91 630 27 51', $s->fresh()->telefono);
        $this->assertSame('+41 91 966 00 91', $s2->fresh()->telefono);
    }
}
