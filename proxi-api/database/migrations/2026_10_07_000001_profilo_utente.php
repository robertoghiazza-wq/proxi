<?php

use App\Models\Institution;
use App\Support\VocaboliDefault;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocaboli', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('categoria', 40);
            $table->string('valore', 120);
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->boolean('attivo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'categoria', 'ordine']);
        });

        Schema::create('persona_profili', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('persona_id')->unique()->constrained('persone')->cascadeOnDelete();

            $table->string('situazione_familiare', 120)->nullable();
            $table->string('fratelli', 120)->nullable();
            $table->string('modalita_educativa', 120)->nullable();
            $table->string('liberta_uscita', 120)->nullable();
            $table->string('origine', 120)->nullable();
            $table->string('madrelingua', 120)->nullable();
            $table->string('formazione_madre', 120)->nullable();
            $table->string('formazione_padre', 120)->nullable();
            $table->string('patente', 120)->nullable();
            $table->string('occupazione', 120)->nullable();
            $table->string('sport_hobby')->nullable();

            $table->text('storia_familiare')->nullable();
            $table->text('storia_scolastica')->nullable();
            $table->text('storia_medica')->nullable();
            $table->text('progetti_interventi')->nullable();

            $table->timestamps();
        });

        Schema::create('persona_sostanze', function (Blueprint $table) {
            $table->id();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->string('sostanza', 120)->nullable();
            $table->string('con_chi', 120)->nullable();
            $table->string('frequenza', 120)->nullable();
            $table->string('abuso', 120)->nullable();
            $table->string('note')->nullable();
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->timestamps();
        });

        Schema::create('persona_diario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->date('data');
            $table->foreignId('autore_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('nota');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['persona_id', 'data']);
        });

        Institution::query()->pluck('id')->each(fn ($id) => VocaboliDefault::seed((int) $id));
    }

    public function down(): void
    {
        Schema::dropIfExists('persona_diario');
        Schema::dropIfExists('persona_sostanze');
        Schema::dropIfExists('persona_profili');
        Schema::dropIfExists('vocaboli');
    }
};
