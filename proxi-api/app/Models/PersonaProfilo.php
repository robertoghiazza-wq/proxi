<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonaProfilo extends Model
{
    use Auditable;

    protected $table = 'persona_profili';

    public const CAMPI = [
        'situazione_familiare', 'fratelli', 'modalita_educativa', 'liberta_uscita', 'origine', 'madrelingua',
        'formazione_madre', 'formazione_padre', 'patente', 'occupazione', 'sport_hobby',
        'storia_familiare', 'storia_scolastica', 'storia_medica', 'progetti_interventi',
    ];

    protected $fillable = ['institution_id', 'persona_id', ...self::CAMPI];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }
}
