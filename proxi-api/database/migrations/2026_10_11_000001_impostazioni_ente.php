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
        Schema::create('categorie_evento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('nome', 80);
            $table->string('colore', 20)->default('grigio');
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->timestamps();
        });

        Schema::create('tipi_evento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('categorie_evento')->cascadeOnDelete();
            $table->string('chiave', 60);          // quello che si salva in eventi.tipo
            $table->string('nome', 80);
            $table->string('colore', 20)->nullable(); // null = colore della categoria
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->boolean('attivo')->default(true);
            $table->timestamps();

            $table->unique(['institution_id', 'chiave']);
        });

        Schema::create('tipi_luogo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('chiave', 60);          // quello che si salva in luoghi.tipo
            $table->string('nome', 80);
            $table->string('colore', 20)->default('grigio');
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->boolean('attivo')->default(true);
            $table->timestamps();

            $table->unique(['institution_id', 'chiave']);
        });

        // luoghi.tipo era un enum fisso: ora è la chiave di un tipo configurabile
        Schema::table('luoghi', function (Blueprint $table) {
            $table->string('tipo', 60)->default('strada')->change();
        });

        foreach (DB::table('institutions')->pluck('id') as $id) {
            TipiDefault::seed((int) $id);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tipi_luogo');
        Schema::dropIfExists('tipi_evento');
        Schema::dropIfExists('categorie_evento');
    }
};
