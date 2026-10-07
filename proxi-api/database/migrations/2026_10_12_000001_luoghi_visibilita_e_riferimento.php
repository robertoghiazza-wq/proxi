<?php

use App\Support\TipiDefault;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tipi_luogo', function (Blueprint $table) {
            $table->boolean('riservato_default')->default(false)->after('colore');
        });

        Schema::table('luoghi', function (Blueprint $table) {
            $table->string('visibilita', 10)->default('pubblico')->after('tipo'); // pubblico | riservato
            $table->string('punto_esatto', 120)->nullable()->after('indirizzo');   // es. "parcheggio", "campo dietro la palestra"
            $table->foreignId('servizio_id')->nullable()->after('punto_esatto')->constrained('servizi')->nullOnDelete();
        });

        // le abitazioni private nascono riservate (anche dove il tipo è stato creato prima della colonna)
        DB::table('tipi_luogo')->where('chiave', 'abitazioni_private')->update(['riservato_default' => true]);

        foreach (DB::table('institutions')->pluck('id') as $id) {
            TipiDefault::aggiornaTipiLuogo((int) $id);
        }
    }

    public function down(): void
    {
        Schema::table('luoghi', function (Blueprint $table) {
            $table->dropConstrainedForeignId('servizio_id');
            $table->dropColumn(['visibilita', 'punto_esatto']);
        });
        Schema::table('tipi_luogo', fn (Blueprint $table) => $table->dropColumn('riservato_default'));
    }
};
