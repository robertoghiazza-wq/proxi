<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Id che i servizi avevano in FileMaker (anche quelli fusi in un altro): servono a ricollegare le persone importate dopo
        Schema::create('servizio_origini', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('servizio_id')->constrained('servizi')->cascadeOnDelete();
            $table->string('id_origine', 60);
            $table->timestamps();

            $table->unique(['institution_id', 'id_origine']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servizio_origini');
    }
};
