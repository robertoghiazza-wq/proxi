<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obiettivi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('responsabile_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('titolo');
            $table->text('descrizione')->nullable();
            $table->decimal('valore_target', 10, 2);
            $table->decimal('valore_attuale', 10, 2)->default(0);
            $table->string('unita')->nullable();     // 'persone', 'ore', 'eventi', ...
            $table->date('scadenza')->nullable();
            $table->enum('stato', ['in_corso', 'raggiunto', 'a_rischio'])->default('in_corso');
            $table->string('periodo')->nullable();   // 'Q1 2026', 'Annuale 2026'

            $table->timestamps();
            $table->index(['institution_id', 'stato']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obiettivi');
    }
};
