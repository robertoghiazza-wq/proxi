<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spese', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('educatore_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('persona_id')->nullable()->constrained('persone')->nullOnDelete();

            $table->enum('categoria', ['pasti', 'trasporto', 'materiale', 'farmacia', 'altro'])->default('altro');
            $table->decimal('importo', 8, 2);
            $table->enum('metodo_pagamento', ['contanti', 'carta', 'twint'])->default('contanti');
            $table->string('descrizione')->nullable();
            $table->string('scontrino_path')->nullable();
            $table->boolean('rimborsato')->default(false);
            $table->date('data');

            $table->timestamps();

            $table->index(['institution_id', 'data']);
            $table->index(['educatore_id', 'data']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spese');
    }
};
