<?php

use App\Models\Institution;
use App\Support\RuoliDefault;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ruoli', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('nome_m');
            $table->string('nome_f')->nullable();
            $table->string('nome_misto')->nullable();
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->boolean('attivo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'ordine']);
        });

        Schema::table('persone', function (Blueprint $table) {
            $table->string('cognome')->nullable()->after('nome');
            $table->date('data_nascita')->nullable()->after('cognome');
            $table->foreignId('ruolo_id')->nullable()->constrained('ruoli')->nullOnDelete();
            $table->string('indirizzo')->nullable();
            $table->string('npa', 10)->nullable();
            $table->string('localita')->nullable();
            $table->string('comune_politico')->nullable();
            $table->string('bfs', 6)->nullable();
            $table->string('cantone', 2)->nullable();
            $table->string('paese')->nullable()->default('Svizzera');
            $table->text('note_contatti')->nullable();
        });

        Schema::create('persona_telefoni', function (Blueprint $table) {
            $table->id();
            $table->foreignId('persona_id')->constrained('persone')->cascadeOnDelete();
            $table->string('etichetta')->nullable();
            $table->string('numero', 40);
            $table->unsignedSmallInteger('ordine')->default(0);
            $table->timestamps();
        });

        Schema::table('luoghi', function (Blueprint $table) {
            $table->string('npa', 10)->nullable();
            $table->string('localita')->nullable();
            $table->string('comune_politico')->nullable();
            $table->string('bfs', 6)->nullable();
            $table->string('cantone', 2)->nullable();
        });

        Schema::table('servizi', function (Blueprint $table) {
            $table->string('comune_politico')->nullable();
            $table->string('bfs', 6)->nullable();
            $table->string('cantone', 2)->nullable();
        });

        Schema::table('evento_persona', function (Blueprint $table) {
            $table->foreignId('ruolo_id')->nullable()->constrained('ruoli')->nullOnDelete();
        });

        Institution::query()->pluck('id')->each(fn ($id) => RuoliDefault::seed((int) $id));
    }

    public function down(): void
    {
        Schema::table('evento_persona', fn (Blueprint $t) => $t->dropConstrainedForeignId('ruolo_id'));
        Schema::table('servizi', fn (Blueprint $t) => $t->dropColumn(['comune_politico', 'bfs', 'cantone']));
        Schema::table('luoghi', fn (Blueprint $t) => $t->dropColumn(['npa', 'localita', 'comune_politico', 'bfs', 'cantone']));
        Schema::dropIfExists('persona_telefoni');
        Schema::table('persone', function (Blueprint $t) {
            $t->dropConstrainedForeignId('ruolo_id');
            $t->dropColumn(['cognome', 'data_nascita', 'indirizzo', 'npa', 'localita', 'comune_politico', 'bfs', 'cantone', 'paese', 'note_contatti']);
        });
        Schema::dropIfExists('ruoli');
    }
};
