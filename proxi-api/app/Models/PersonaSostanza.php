<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonaSostanza extends Model
{
    protected $table = 'persona_sostanze';

    protected $fillable = ['persona_id', 'sostanza', 'con_chi', 'frequenza', 'abuso', 'note', 'ordine'];

    protected $hidden = ['created_at', 'updated_at'];
}
