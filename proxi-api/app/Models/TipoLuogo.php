<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class TipoLuogo extends Model
{
    use Auditable;

    protected $table = 'tipi_luogo';

    protected $fillable = ['institution_id', 'chiave', 'nome', 'colore', 'riservato_default', 'ordine', 'attivo'];

    protected $casts = ['attivo' => 'boolean', 'riservato_default' => 'boolean'];
}
