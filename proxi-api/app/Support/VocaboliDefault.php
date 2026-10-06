<?php

namespace App\Support;

use App\Models\Vocabolo;

// Elenchi a tendina predefiniti per ente (modificabili da coordinatori/admin). Valori di partenza: da rivedere con quelli di FileMaker.
class VocaboliDefault
{
    public const CATEGORIE = [
        'situazione_familiare' => 'Situazione familiare',
        'fratelli'             => 'Fratelli',
        'modalita_educativa'   => 'Modalità educativa',
        'liberta_uscita'       => 'Libertà di uscita',
        'origine'              => 'Origine',
        'madrelingua'          => 'Madrelingua',
        'formazione'           => 'Formazione (madre e padre)',
        'occupazione'          => 'Occupazione',
        'sostanza'             => 'Sostanza',
        'con_chi'              => 'Consumo: con chi',
        'frequenza'            => 'Consumo: frequenza',
        'abuso'                => 'Consumo: abuso',
    ];

    public static function elenco(): array
    {
        return [
            'situazione_familiare' => ['Genitori conviventi', 'Genitori separati o divorziati', 'Famiglia monoparentale', 'Famiglia ricomposta', 'Affido', 'Istituto', 'Vive da solo', 'Altro'],
            'fratelli'             => ['Figlio unico', '1 fratello/sorella', '2 fratelli/sorelle', '3 fratelli/sorelle', '4 o più'],
            'modalita_educativa'   => ['Autorevole', 'Permissiva', 'Autoritaria', 'Trascurante', 'Altro'],
            'liberta_uscita'       => ['Nessuna restrizione', 'Orari concordati', 'Limitata', 'Non può uscire'],
            'origine'              => ['Svizzera', 'Italia', 'Balcani', 'Portogallo', 'Altra Europa', 'Africa', 'Asia', 'America', 'Altro'],
            'madrelingua'          => ['Italiano', 'Tedesco', 'Francese', 'Portoghese', 'Spagnolo', 'Albanese', 'Serbo-croato', 'Altro'],
            'formazione'           => ['Nessuna', 'Scuola dell’obbligo', 'Apprendistato', 'Scuola media superiore', 'Università o SUP', 'Non so'],
            'occupazione'          => ['Scuola dell’obbligo', 'Apprendista', 'Studente', 'Lavora', 'In cerca di lavoro', 'Nessuna', 'Altro'],
            'sostanza'             => ['Alcol', 'Tabacco', 'Cannabis', 'Cocaina', 'Eroina', 'Anfetamine o ecstasy', 'Psicofarmaci', 'Altro'],
            'con_chi'              => ['Da solo', 'Con amici', 'In famiglia', 'Con il partner', 'Altro'],
            'frequenza'            => ['Mai', 'Occasionale', 'Mensile', 'Settimanale', 'Quotidiana'],
            'abuso'                => ['No', 'Sospetto', 'Sì'],
        ];
    }

    public static function seed(int $institutionId): void
    {
        if (Vocabolo::where('institution_id', $institutionId)->exists()) {
            return;
        }

        $now = now();
        $righe = [];
        foreach (self::elenco() as $categoria => $valori) {
            foreach ($valori as $i => $valore) {
                $righe[] = [
                    'institution_id' => $institutionId, 'categoria' => $categoria, 'valore' => $valore,
                    'ordine' => ($i + 1) * 10, 'attivo' => true, 'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        Vocabolo::insert($righe);
    }
}
