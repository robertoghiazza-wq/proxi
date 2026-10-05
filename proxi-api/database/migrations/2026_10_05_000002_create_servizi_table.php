<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servizi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();

            $table->string('nome');
            $table->string('indirizzo')->nullable();
            $table->string('cap', 10)->nullable();
            $table->string('localita')->nullable();
            $table->string('paese')->default('Svizzera');
            $table->string('telefono', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('sito')->nullable();
            $table->text('note')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->boolean('attivo')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'nome']);
        });

        Schema::create('persona_servizio', function (Blueprint $table) {
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->foreignId('servizio_id')->constrained('servizi')->cascadeOnDelete();
            $table->string('ruolo')->nullable();
            $table->boolean('principale')->default(false);
            $table->timestamps();

            $table->primary(['persona_id', 'servizio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('persona_servizio');
        Schema::dropIfExists('servizi');
    }
};
