<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class CategoriaEvento extends Model
{
    use Auditable;

    protected $table = 'categorie_evento';

    protected $fillable = ['institution_id', 'nome', 'colore', 'ordine'];
}
