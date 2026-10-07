<?php

namespace Tests\Feature;

use App\Models\Evento;
use App\Models\ImpostazioneApp;
use App\Models\Institution;
use App\Models\Luogo;
use App\Models\Persona;
use App\Models\ReportAutomatico;
use App\Models\ReportInvio;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private Institution $inst;
    private User $coord;
    private User $educatore;
    private Luogo $parco;
    private Luogo $casa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inst = Institution::forceCreate(['name' => 'Associazione Prometheus', 'slug' => 'p', 'motto' => 'dà luce ai giovani!', 'sito' => 'www.example.ch']);
        $this->coord = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'coordinatore', 'name' => 'Giulia Mazza', 'email' => 'giulia@example.ch']);
        $this->educatore = User::factory()->create(['institution_id' => $this->inst->id, 'role' => 'educatore', 'name' => 'Dario Marsilio']);
        $this->parco = Luogo::forceCreate(['institution_id' => $this->inst->id, 'nome' => 'Parco Giova', 'tipo' => 'parchi_piazze_sport', 'attivo' => true]);
        $this->casa = Luogo::forceCreate(['institution_id' => $this->inst->id, 'nome' => 'Casa di Anna Rossi', 'tipo' => 'abitazioni_private', 'visibilita' => 'riservato', 'attivo' => true]);
        Sanctum::actingAs($this->coord);
    }

    private function evento(string $data, array $extra = []): Evento
    {
        return Evento::forceCreate($extra + [
            'institution_id' => $this->inst->id, 'educatore_id' => $this->educatore->id, 'luogo_id' => $this->parco->id,
            'tipo' => 'uscita', 'data' => $data, 'ora_inizio' => '19:00', 'durata_min' => 330, 'stato' => 'completato', 'note' => 'Serata tranquilla con Elia.',
        ]);
    }

    private function persone(Evento $e): void
    {
        $a = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'Lorenzo', 'cognome' => 'Zasa', 'soprannome' => 'Lollo', 'sesso' => 'M']);
        $b = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'nome' => 'Matilde', 'cognome' => 'Capobianco', 'sesso' => 'F']);
        $c = Persona::create(['institution_id' => $this->inst->id, 'ruolo' => 'utente', 'soprannome' => 'Il Polacco', 'anonimo' => true, 'sesso' => 'M']);
        $e->persone()->attach([$a->id, $b->id, $c->id]);
    }

    public function test_resoconto_settimanale_nel_formato_dei_rapporti(): void
    {
        // 5 agosto 2026 = mercoledì della settimana ISO 32
        $e = $this->evento('2026-08-05');
        $this->persone($e);
        $e->soste()->createMany([
            ['luogo_id' => $this->parco->id, 'dalle' => '20:00', 'alle' => '20:30', 'ordine' => 0],
            ['luogo_id' => $this->parco->id, 'dalle' => '20:30', 'alle' => '00:30', 'ordine' => 1],
        ]);
        $this->evento('2026-08-12');                 // altra settimana
        $this->evento('2026-08-06', ['stato' => 'pianificato']);  // non svolto

        $r = $this->getJson('/api/report/settimana?anno=2026&settimana=32')->assertOk();
        $this->assertSame('Resoconto settimanale 32/2026', $r->json('titolo'));
        $this->assertSame('2026-08-03', $r->json('periodo.dal'));
        $this->assertCount(1, $r->json('giorni'));
        $this->assertSame('mercoledì, 5 agosto 2026', $r->json('giorni.0.etichetta'));

        $ev = $r->json('giorni.0.eventi.0');
        $this->assertSame('19:00', $ev['dalle']);
        $this->assertSame('00:30', $ev['alle']);
        $this->assertSame('5.5', $ev['durata_ore']);
        $this->assertSame('Uscita sul territorio', $ev['tipo']);
        $this->assertSame('Dario Marsilio', $ev['educatore']);
        $this->assertCount(2, $ev['luoghi']);
        $this->assertSame(['totale' => 3, 'm' => 2, 'f' => 1, 'altro' => 0, 'nd' => 0, 'nomi' => ['Lorenzo Zasa (Lollo)', 'Matilde Capobianco', '«Il Polacco»']], $ev['presenti']);
        $this->assertSame('Serata tranquilla con Elia.', $ev['racconto']);
    }

    public function test_privacy_iniziali_nessun_nome_senza_racconto_e_luoghi_riservati(): void
    {
        $e = $this->evento('2026-08-05', ['luogo_id' => $this->casa->id]);
        $this->persone($e);

        $r = $this->getJson('/api/report/settimana?anno=2026&settimana=32&nomi=iniziali&racconto=0')->assertOk();
        $ev = $r->json('giorni.0.eventi.0');
        $this->assertSame(['L. Z.', 'M. C.', '«Il Polacco»'], $ev['presenti']['nomi']);
        $this->assertNull($ev['racconto']);
        $this->assertSame('Abitazioni private', $ev['luoghi'][0]['nome']);       // il nome della casa non esce

        $r = $this->getJson('/api/report/settimana?anno=2026&settimana=32&nomi=nessuno')->assertOk();
        $this->assertSame([], $r->json('giorni.0.eventi.0.presenti.nomi'));
        $this->assertSame(3, $r->json('giorni.0.eventi.0.presenti.totale'));       // i conteggi restano

        $r = $this->getJson('/api/report/settimana?anno=2026&settimana=32&nomi=completi')->assertOk();
        $this->assertSame('Casa di Anna Rossi', $r->json('giorni.0.eventi.0.luoghi.0.nome'));
    }

    public function test_solo_i_gestori_accedono_ai_report(): void
    {
        Sanctum::actingAs($this->educatore);
        $this->getJson('/api/report/settimana?anno=2026&settimana=32')->assertForbidden();
        $this->postJson('/api/report/settimana/invia', ['anno' => 2026, 'settimana' => 32, 'destinatari' => ['a@example.ch']])->assertForbidden();
        $this->getJson('/api/report/automatico')->assertForbidden();
    }

    public function test_estratto_di_un_evento_e_isolamento_tra_enti(): void
    {
        $mio = $this->evento('2026-08-05');
        $altro = Institution::forceCreate(['name' => 'Altro', 'slug' => 'a']);
        $estraneo = Evento::forceCreate(['institution_id' => $altro->id, 'educatore_id' => $this->educatore->id, 'tipo' => 'uscita', 'data' => '2026-08-05', 'durata_min' => 60, 'stato' => 'completato']);

        $r = $this->postJson('/api/report/estratto', ['ids' => [$mio->id, $estraneo->id]])->assertOk();
        $this->assertSame('Estratto di un evento', $r->json('titolo'));
        $this->assertSame(1, $r->json('totali.eventi'));          // l'evento di un altro ente non entra
    }

    public function test_pdf_e_invio_per_email(): void
    {
        $this->evento('2026-08-05');

        if (class_exists(\Dompdf\Dompdf::class)) {
            $r = $this->get('/api/report/settimana/pdf?anno=2026&settimana=32')->assertOk()->assertHeader('Content-Type', 'application/pdf');
            $this->assertStringStartsWith('%PDF', $r->getContent());
        }

        $r = $this->postJson('/api/report/settimana/invia', [
            'anno' => 2026, 'settimana' => 32, 'destinatari' => ['Partner@Example.ch', 'altro@example.ch'], 'nomi' => 'iniziali',
        ])->assertOk()->assertJsonPath('esito', 'ok');

        $messaggi = Mail::mailer()->getSymfonyTransport()->messages();
        $this->assertCount(2, $messaggi);                           // un messaggio per destinatario
        $this->assertStringContainsString('Resoconto settimanale 32/2026', $messaggi[0]->getOriginalMessage()->getSubject());
        $this->assertSame('iniziali', ReportInvio::first()->nomi);
        $this->assertSame(['partner@example.ch', 'altro@example.ch'], ReportInvio::first()->destinatari);

        $this->postJson('/api/report/settimana/invia', ['anno' => 2026, 'settimana' => 32, 'destinatari' => ['non-una-mail']])->assertUnprocessable();
    }

    public function test_invio_automatico_attivita_pianificata(): void
    {
        $this->evento('2026-08-05');
        $this->putJson('/api/report/automatico', ['attivo' => true, 'giorno' => 1, 'ora' => 8, 'destinatari' => [], 'nomi' => 'iniziali', 'racconto' => true])->assertUnprocessable();
        $this->putJson('/api/report/automatico', ['attivo' => true, 'giorno' => 1, 'ora' => 8, 'destinatari' => ['partner@example.ch'], 'nomi' => 'iniziali', 'racconto' => true])->assertOk();

        // senza chiave valida l'attività pianificata è chiusa
        $this->getJson('/api/cron/report')->assertForbidden();
        ImpostazioneApp::imposta('cron_token', 'segreta-lunga');
        $this->getJson('/api/cron/report?chiave=sbagliata')->assertForbidden();

        // lunedì 10 agosto 2026 alle 07:00: non è ancora l'ora
        Carbon::setTestNow(Carbon::parse('2026-08-10 07:00', 'Europe/Zurich'));
        $this->getJson('/api/cron/report?chiave=segreta-lunga')->assertOk()->assertJsonCount(0, 'invii');

        // alle 08:00 parte il resoconto della settimana 32 (3–9 agosto), una sola volta
        Carbon::setTestNow(Carbon::parse('2026-08-10 08:05', 'Europe/Zurich'));
        $this->getJson('/api/cron/report?chiave=segreta-lunga')->assertOk()->assertJsonPath('invii.0.settimana', '2026-W32')->assertJsonPath('invii.0.esito', 'ok');
        $this->getJson('/api/cron/report?chiave=segreta-lunga')->assertOk()->assertJsonCount(0, 'invii');
        $this->assertSame('2026-W32', ReportAutomatico::first()->ultima_settimana);
        $this->assertSame('automatico', ReportInvio::first()->tipo);

        // la settimana dopo, senza eventi, non si invia nulla (resta annotato)
        Carbon::setTestNow(Carbon::parse('2026-08-24 09:00', 'Europe/Zurich'));
        $this->getJson('/api/cron/report?chiave=segreta-lunga')->assertOk()->assertJsonPath('invii.0.esito', 'saltato');
        Carbon::setTestNow();
    }

    public function test_le_tappe_dell_evento_si_salvano_e_si_leggono(): void
    {
        $r = $this->postJson('/api/eventi', [
            'luogo_id' => $this->parco->id, 'tipo' => 'uscita', 'data' => '2026-08-05', 'ora_inizio' => '19:00', 'durata_min' => 330, 'stato' => 'completato',
            'soste' => [['luogo_id' => $this->parco->id, 'dalle' => '20:00', 'alle' => '20:30'], ['luogo_id' => $this->casa->id, 'dalle' => '20:30', 'alle' => '00:30']],
        ])->assertCreated();
        $this->assertCount(2, $r->json('soste'));
        $id = $r->json('id');

        $this->getJson("/api/eventi/{$id}")->assertOk()->assertJsonPath('soste.1.luogo.nome', 'Casa di Anna Rossi')->assertJsonPath('soste.1.alle', '00:30');

        // cambiando il luogo dell'evento senza indicare le tappe, le vecchie tappe cadono
        $this->patchJson("/api/eventi/{$id}", ['luogo_id' => $this->casa->id])->assertOk()->assertJsonCount(0, 'soste');
    }
}
