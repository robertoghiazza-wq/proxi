<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class TipoEvento extends Model
{
    use Auditable;

    protected $table = 'tipi_evento';

    protected $fillable = ['institution_id', 'categoria_id', 'chiave', 'nome', 'colore', 'ordine', 'attivo'];

    protected $casts = ['attivo' => 'boolean'];
}
