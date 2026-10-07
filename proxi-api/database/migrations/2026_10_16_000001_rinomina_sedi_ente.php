<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // le sedi non sono solo di associazioni (comuni, fondazioni…): solo dove il nome è ancora quello di partenza
        DB::table('tipi_luogo')->where('chiave', 'sedi_associazione')->where('nome', "Sedi dell'associazione")->update(['nome' => "Sedi dell'ente"]);
    }

    public function down(): void
    {
        DB::table('tipi_luogo')->where('chiave', 'sedi_associazione')->where('nome', "Sedi dell'ente")->update(['nome' => "Sedi dell'associazione"]);
    }
};
