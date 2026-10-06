<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ore_mensili', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->unsignedSmallInteger('anno');
            $table->unsignedTinyInteger('mese');

            $table->decimal('vacanze_giorni', 5, 2)->default(0);
            $table->decimal('festivi_giorni', 5, 2)->default(0);
            $table->decimal('correzione_ore', 6, 2)->default(0);
            $table->string('nota')->nullable();

            $table->timestamps();

            $table->unique(['persona_id', 'anno', 'mese']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ore_mensili');
    }
};
