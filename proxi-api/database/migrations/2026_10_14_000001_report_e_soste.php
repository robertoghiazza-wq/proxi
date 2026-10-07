<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tappe di un evento: più luoghi con orario (es. Parco Giova 20:00-20:30, Migros Agno 20:30-00:30)
        Schema::create('evento_soste', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('eventi')->cascadeOnDelete();
            $table->foreignId('luogo_id')->nullable()->constrained('luoghi')->nullOnDelete();
            $table->time('dalle')->nullable();
            $table->time('alle')->nullable();
            $table->unsignedSmallInteger('ordine')->default(0);
        });

        // Intestazione dei report: motto, sito, indirizzo mittente
        Schema::table('institutions', function (Blueprint $table) {
            $table->string('motto', 120)->nullable();
            $table->string('sito', 120)->nullable();
            $table->string('email_mittente', 120)->nullable();
        });

        // Registro degli invii (manuali e automatici)
        Schema::create('report_invii', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tipo', 20);                 // settimana | estratto | automatico
            $table->string('riferimento', 80);          // es. "2026-W32" o "evento 15"
            $table->json('destinatari');
            $table->string('nomi', 12)->default('completi');
            $table->boolean('racconto')->default(true);
            $table->boolean('con_pdf')->default(true);
            $table->string('esito', 10);                // ok | errore | saltato
            $table->text('dettaglio')->nullable();
            $table->timestamps();
        });

        // Invio automatico del resoconto della settimana appena finita
        Schema::create('report_automatici', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('attivo')->default(false);
            $table->unsignedTinyInteger('giorno')->default(1);   // 1 = lunedì … 7 = domenica
            $table->unsignedTinyInteger('ora')->default(8);
            $table->json('destinatari')->nullable();
            $table->string('nomi', 12)->default('iniziali');
            $table->boolean('racconto')->default(true);
            $table->string('oggetto')->nullable();
            $table->text('messaggio')->nullable();
            $table->string('ultima_settimana', 10)->nullable();  // es. "2026-W32": già inviata
            $table->timestamp('ultimo_invio_il')->nullable();
            $table->timestamps();
        });

        // Valori di sistema (es. la chiave segreta dell'attività pianificata)
        Schema::create('impostazioni_app', function (Blueprint $table) {
            $table->string('chiave', 60)->primary();
            $table->text('valore')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('impostazioni_app');
        Schema::dropIfExists('report_automatici');
        Schema::dropIfExists('report_invii');
        Schema::table('institutions', fn (Blueprint $table) => $table->dropColumn(['motto', 'sito', 'email_mittente']));
        Schema::dropIfExists('evento_soste');
    }
};
