<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class OreMensile extends Model
{
    use Auditable;

    protected $table = 'ore_mensili';

    protected $fillable = [
        'institution_id', 'persona_id', 'anno', 'mese', 'vacanze_giorni', 'festivi_giorni', 'correzione_ore', 'nota',
    ];

    protected $casts = [
        'anno' => 'integer', 'mese' => 'integer',
        'vacanze_giorni' => 'float', 'festivi_giorni' => 'float', 'correzione_ore' => 'float',
    ];
}
