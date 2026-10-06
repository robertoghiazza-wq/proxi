<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persona_documenti', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->string('tipo', 60)->nullable();
            $table->string('titolo');
            $table->text('note')->nullable();
            $table->string('percorso');
            $table->string('nome_originale');
            $table->string('mime', 120);
            $table->unsignedBigInteger('dimensione');
            $table->foreignId('caricato_da')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['persona_id', 'created_at']);
        });

        Schema::table('persone', function (Blueprint $table) {
            $table->string('foto_percorso')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('persone', fn (Blueprint $table) => $table->dropColumn('foto_percorso'));
        Schema::dropIfExists('persona_documenti');
    }
};
