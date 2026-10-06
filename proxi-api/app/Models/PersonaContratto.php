<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonaContratto extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'persona_contratti';

    protected $fillable = [
        'institution_id', 'persona_id', 'stipendio_annuo', 'grado', 'ore_settimanali', 'data_inizio', 'data_fine',
        'iban', 'cassa_malati', 'avs', 'note',
    ];

    protected $casts = [
        'stipendio_annuo' => 'decimal:2',
        'grado'           => 'decimal:2',
        'ore_settimanali' => 'decimal:2',
        'data_inizio'     => 'date:Y-m-d',
        'data_fine'       => 'date:Y-m-d',
        'iban'            => 'encrypted',
        'avs'             => 'encrypted',
    ];

    // Nel log si registra che il dato è cambiato, non il suo valore.
    protected function auditMascherati(): array
    {
        return ['stipendio_annuo', 'iban', 'avs'];
    }
}
