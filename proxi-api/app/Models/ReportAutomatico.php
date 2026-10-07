<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportAutomatico extends Model
{
    protected $table = 'report_automatici';

    protected $fillable = ['institution_id', 'attivo', 'giorno', 'ora', 'destinatari', 'nomi', 'racconto', 'oggetto', 'messaggio'];

    protected $casts = ['attivo' => 'boolean', 'destinatari' => 'array', 'racconto' => 'boolean', 'ultimo_invio_il' => 'datetime'];
}
