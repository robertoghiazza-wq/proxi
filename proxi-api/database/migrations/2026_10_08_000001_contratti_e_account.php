<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persona_contratti', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();

            $table->decimal('stipendio_annuo', 10, 2)->nullable();
            $table->decimal('grado', 5, 2)->nullable();
            $table->decimal('ore_settimanali', 5, 2)->nullable();
            $table->date('data_inizio');
            $table->date('data_fine')->nullable();

            $table->text('iban')->nullable();          // cifrato
            $table->string('cassa_malati')->nullable();
            $table->text('avs')->nullable();           // cifrato
            $table->text('note')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['persona_id', 'data_inizio']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('persona_id')->nullable()->unique()->constrained('persone')->nullOnDelete();
            $table->boolean('attivo')->default(true);
            $table->string('invito_hash', 64)->nullable();
            $table->timestamp('invito_scade_il')->nullable();
            $table->timestamp('ultimo_accesso_il')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('persona_id');
            $table->dropColumn(['attivo', 'invito_hash', 'invito_scade_il', 'ultimo_accesso_il']);
        });
        Schema::dropIfExists('persona_contratti');
    }
};
