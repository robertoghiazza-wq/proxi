<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServizioOrigine extends Model
{
    protected $table = 'servizio_origini';

    protected $fillable = ['institution_id', 'servizio_id', 'id_origine'];
}
