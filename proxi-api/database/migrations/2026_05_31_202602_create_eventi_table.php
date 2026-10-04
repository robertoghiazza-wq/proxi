<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('educatore_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('luogo_id')->nullable()->constrained('luoghi')->nullOnDelete();

            $table->string('tipo');          // incontro, accompagnamento, colloquio, ...
            $table->date('data');
            $table->time('ora_inizio')->nullable();
            $table->unsignedSmallInteger('durata_min')->default(30);
            $table->enum('stato', ['pianificato', 'in_corso', 'completato'])->default('pianificato');
            $table->text('note')->nullable();

            $table->timestamps();

            $table->index(['institution_id', 'data']);
            $table->index(['educatore_id', 'data']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventi');
    }
};
