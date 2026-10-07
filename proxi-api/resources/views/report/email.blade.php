<div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #1b1e23; line-height: 1.55; max-width: 640px;">
  <div style="white-space: pre-wrap;">{{ $messaggio }}</div>
  @if ($inline)
    <hr style="border: none; border-top: 1px solid #dcdfe3; margin: 24px 0;">
    {!! $inline !!}
  @endif
  <p style="margin-top: 28px; font-size: 12px; color: #8a909a;">Inviato da Proxi per conto di {{ $ente }}.</p>
</div>
