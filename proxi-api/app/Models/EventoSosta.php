<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoSosta extends Model
{
    public $timestamps = false;

    protected $table = 'evento_soste';

    protected $fillable = ['evento_id', 'luogo_id', 'dalle', 'alle', 'ordine'];

    // MySQL TIME restituisce HH:MM:SS — tronca a HH:MM
    public function getDalleAttribute(?string $v): ?string
    {
        return $v ? substr($v, 0, 5) : null;
    }

    public function getAlleAttribute(?string $v): ?string
    {
        return $v ? substr($v, 0, 5) : null;
    }

    public function luogo(): BelongsTo
    {
        return $this->belongsTo(Luogo::class);
    }
}
