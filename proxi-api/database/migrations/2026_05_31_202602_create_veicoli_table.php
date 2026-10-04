<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('veicoli', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();

            $table->string('modello');
            $table->string('targa')->unique();
            $table->unsignedSmallInteger('anno')->nullable();
            $table->unsignedInteger('km_attuali')->default(0);
            $table->date('prossima_manutenzione')->nullable();
            $table->enum('stato', ['disponibile', 'in_uso', 'manutenzione'])->default('disponibile');
            $table->boolean('attivo')->default(true);

            $table->timestamps();
            $table->index('institution_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('veicoli');
    }
};
