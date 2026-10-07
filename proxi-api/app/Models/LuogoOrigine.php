<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuogoOrigine extends Model
{
    protected $table = 'luogo_origini';

    protected $fillable = ['institution_id', 'luogo_id', 'id_origine'];
}
