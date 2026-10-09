<?php

namespace App\Support;

// Numeri di telefono nel formato internazionale (come lo scrive l'app: «+41 79 123 45 67»).
// Sistema solo i numeri riconoscibili con certezza (svizzeri con lo 0, o già con il prefisso); gli altri restano come sono.
class Telefono
{
    // null = non riconoscibile: lasciare il valore com'è
    public static function internazionale(?string $numero): ?string
    {
        $t = trim((string) $numero);
        if ($t === '') return null;
        if (preg_match('/[^\d\s+().\/-]/u', $t)) return null;          // testo, interni, «oppure»…: non si tocca

        $cifre = preg_replace('/\D/', '', $t);
        if (str_starts_with($t, '+')) {
            // già internazionale (anche «+41 (0) 79…»)
            $cifre = preg_replace('/^(\d{2,3})0(\d+)$/', '$1$2', $cifre) ?: $cifre;
        } elseif (str_starts_with($cifre, '00')) {
            $cifre = substr($cifre, 2);
        } elseif (str_starts_with($cifre, '0') && strlen($cifre) === 10) {
            $cifre = '41'.substr($cifre, 1);                              // numero svizzero scritto all'italiana: 079 123 45 67
        } else {
            return null;
        }

        if (strlen($cifre) < 9 || strlen($cifre) > 15) return null;

        // Svizzera e Liechtenstein: +41 AA BBB CC DD
        if (str_starts_with($cifre, '41') && strlen($cifre) === 11) {
            return '+41 '.substr($cifre, 2, 2).' '.substr($cifre, 4, 3).' '.substr($cifre, 7, 2).' '.substr($cifre, 9, 2);
        }
        // Italia, cellulari: +39 3XX XXX XXXX
        if (str_starts_with($cifre, '393') && strlen($cifre) >= 12 && strlen($cifre) <= 13) {
            return '+39 '.substr($cifre, 2, 3).' '.substr($cifre, 5, 3).' '.substr($cifre, 8);
        }
        // altri: se era già scritto con spazi si tiene, altrimenti prefisso e blocco unico
        if (str_starts_with($t, '+') && preg_match('/^\+\d{1,3}( \d+)+$/', $t)) return $t;

        return '+'.self::prefisso($cifre).' '.substr($cifre, strlen(self::prefisso($cifre)));
    }

    // prefissi più comuni (1-3 cifre); in mancanza, le prime due cifre
    private static function prefisso(string $cifre): string
    {
        foreach (['423', '352', '351', '353', '358'] as $p) if (str_starts_with($cifre, $p)) return $p;
        if (str_starts_with($cifre, '1')) return '1';
        if (str_starts_with($cifre, '7')) return '7';

        return substr($cifre, 0, 2);
    }
}
