<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // il tipo residuale comprende anche i parcheggi senza altro riferimento (solo dove il nome è ancora quello di partenza)
        DB::table('tipi_luogo')
            ->where('chiave', 'strade_senza_riferimento')
            ->where('nome', 'Strade e aree senza altro riferimento')
            ->update(['nome' => 'Strade, parcheggi e aree senza altro riferimento']);
    }

    public function down(): void
    {
        DB::table('tipi_luogo')
            ->where('chiave', 'strade_senza_riferimento')
            ->where('nome', 'Strade, parcheggi e aree senza altro riferimento')
            ->update(['nome' => 'Strade e aree senza altro riferimento']);
    }
};
