<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persone', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();

            $table->enum('ruolo', ['utente', 'dipendente', 'rete'])->default('utente');
            $table->string('nome')->nullable();
            $table->string('soprannome')->nullable();
            $table->boolean('anonimo')->default(false);

            $table->unsignedSmallInteger('eta')->nullable();
            $table->enum('sesso', ['M', 'F', 'altro'])->nullable();
            $table->json('lingue')->nullable();

            $table->json('tag')->nullable();
            $table->json('bisogni')->nullable();
            $table->text('note')->nullable();

            $table->string('telefono')->nullable();
            $table->string('email')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['institution_id', 'ruolo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('persone');
    }
};
