<?php

namespace App\Support;

// Controlli di formato per dati sensibili svizzeri.
class Validazione
{
    public static function iban(string $valore): ?string
    {
        $s = strtoupper(preg_replace('/\s+/', '', $valore));
        if (! preg_match('/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/', $s)) {
            return null;
        }

        $r = substr($s, 4) . substr($s, 0, 4);
        $n = '';
        foreach (str_split($r) as $c) {
            $n .= ctype_alpha($c) ? (string) (ord($c) - 55) : $c;
        }

        $resto = 0;
        foreach (str_split($n, 7) as $blocco) {
            $resto = (int) ($resto . $blocco) % 97;
        }

        return $resto === 1 ? $s : null;
    }

    // Numero AVS/AHV: 13 cifre, inizia con 756, ultima cifra di controllo EAN-13. Restituisce 756.XXXX.XXXX.XX
    public static function avs(string $valore): ?string
    {
        $d = preg_replace('/\D/', '', $valore);
        if (strlen($d) !== 13 || ! str_starts_with($d, '756')) {
            return null;
        }

        $somma = 0;
        for ($i = 0; $i < 12; $i++) {
            $somma += (int) $d[$i] * ($i % 2 === 0 ? 1 : 3);
        }
        if ((10 - $somma % 10) % 10 !== (int) $d[12]) {
            return null;
        }

        return substr($d, 0, 3) . '.' . substr($d, 3, 4) . '.' . substr($d, 7, 4) . '.' . substr($d, 11, 2);
    }
}
