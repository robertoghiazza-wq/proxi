<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const NOMI = [
        'strutture_pubbliche' => ['Strutture pubbliche e comunità', 'Strutture pubbliche e comunitarie'],
        'aziende_officine'    => ['Aziende e officine', 'Aziende, società e officine'],
        'centri_giovani'      => ['Centri giovani e spazi aggregativi', 'Centri giovani e spazi socio-educativi'],
    ];

    public function up(): void
    {
        // nomi più larghi per tre tipi di luogo (solo dove il nome è ancora quello di partenza)
        foreach (self::NOMI as $chiave => [$vecchio, $nuovo]) {
            DB::table('tipi_luogo')->where('chiave', $chiave)->where('nome', $vecchio)->update(['nome' => $nuovo]);
        }

        // posizione ricostruita o approssimata: da controllare a mano
        Schema::table('luoghi', function (Blueprint $table) {
            $table->boolean('posizione_da_controllare')->default(false);
        });

        // Id che i luoghi avevano in FileMaker (anche quelli fusi in un altro): servono a ricollegare eventi e relazioni importati dopo
        Schema::create('luogo_origini', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('luogo_id')->constrained('luoghi')->cascadeOnDelete();
            $table->string('id_origine', 60);
            $table->timestamps();

            $table->unique(['institution_id', 'id_origine']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('luogo_origini');
        Schema::table('luoghi', fn (Blueprint $table) => $table->dropColumn('posizione_da_controllare'));
    }
};
