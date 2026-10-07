<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // zone e comuni: la posizione approssimata è giusta così, non va segnalata
        DB::table('luoghi')->where('tipo', 'zone_comuni')->update(['posizione_da_controllare' => false]);
    }

    public function down(): void {}
};
