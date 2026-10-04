<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('luoghi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();

            $table->string('nome');
            $table->enum('tipo', ['strada', 'informale', 'diurno', 'sanitario', 'ufficio'])->default('strada');
            $table->string('indirizzo')->nullable();
            $table->string('orari')->nullable();
            $table->text('note')->nullable();

            // Coordinate per reverse geocoding via map.geo.admin.ch
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            $table->boolean('attivo')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['institution_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('luoghi');
    }
};
