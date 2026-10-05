<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonaTelefono extends Model
{
    protected $table = 'persona_telefoni';

    protected $fillable = ['persona_id', 'etichetta', 'numero', 'ordine'];

    protected $hidden = ['created_at', 'updated_at'];
}
