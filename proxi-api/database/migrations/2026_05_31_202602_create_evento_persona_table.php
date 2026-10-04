<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evento_persona', function (Blueprint $table) {
            $table->foreignId('evento_id')->constrained('eventi')->cascadeOnDelete();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->primary(['evento_id', 'persona_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evento_persona');
    }
};
