<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<style>
  @page { margin: 42px 48px 48px 48px; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1b1e23; line-height: 1.45; }
  table.testata { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
  table.testata td { vertical-align: middle; padding: 0; }
  .ente { font-size: 20px; font-weight: bold; color: {{ $accento }}; }
  .motto { font-size: 11px; font-style: italic; color: #7a808a; }
  .sito { text-align: right; font-size: 11px; font-style: italic; color: #7a808a; }
  h1 { font-size: 21px; margin: 0 0 4px 0; }
  .sottotitolo { font-size: 12px; color: #6a707a; margin-bottom: 20px; }
  h2 { font-size: 14px; margin: 22px 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #1b1e23; text-transform: none; }
  .evento { margin-bottom: 16px; page-break-inside: avoid; }
  .luoghi { font-style: italic; }
  .racconto { margin-top: 10px; text-align: justify; white-space: pre-wrap; }
  .piede { margin-top: 28px; font-size: 9.5px; color: #8a909a; border-top: 1px solid #dcdfe3; padding-top: 6px; }
</style>
</head>
<body>
<table class="testata">
  <tr>
    <td style="width: 60%;">
      @if ($doc['ente']['logo'])
        <img src="{{ $doc['ente']['logo'] }}" style="height: 54px;" alt="{{ $doc['ente']['nome'] }}">
      @else
        <div class="ente">{{ $doc['ente']['nome'] }}</div>
      @endif
      @if ($doc['ente']['motto'])<div class="motto">{{ $doc['ente']['motto'] }}</div>@endif
    </td>
    <td class="sito">{{ $doc['ente']['sito'] }}</td>
  </tr>
</table>

<h1>{{ $doc['titolo'] }}</h1>
@if ($doc['sottotitolo'])<div class="sottotitolo">{{ $doc['sottotitolo'] }}</div>@endif

@forelse ($doc['giorni'] as $giorno)
  <h2>{{ $giorno['etichetta'] }}</h2>
  @foreach ($giorno['eventi'] as $e)
    <div class="evento">
      <div><strong>{{ $e['testo']['quando'] }}</strong> - {{ $e['testo']['resto'] }}</div>
      @if ($e['testo']['luoghi'] !== '')
        <div class="luoghi">{{ $e['testo']['luoghi'] }}</div>
      @endif
      <div><strong>{{ $e['testo']['presenti'] }}</strong> {{ $e['testo']['presenti_dettaglio'] }}</div>
      @if ($e['racconto'])
        <div class="racconto">{{ $e['racconto'] }}</div>
      @endif
    </div>
  @endforeach
@empty
  <p>Nessun evento svolto nel periodo.</p>
@endforelse

@if ($nota)
  <div class="piede">{{ $nota }}</div>
@endif
</body>
</html>
