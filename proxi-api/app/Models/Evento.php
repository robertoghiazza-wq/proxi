<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Evento extends Model
{
    protected $table = 'eventi';

    protected $fillable = [
        'institution_id', 'educatore_id', 'luogo_id',
        'tipo', 'data', 'ora_inizio', 'durata_min', 'stato', 'note',
    ];

    protected $casts = [
        'data'       => 'date:Y-m-d',
        'durata_min' => 'integer',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function educatore(): BelongsTo
    {
        return $this->belongsTo(User::class, 'educatore_id');
    }

    public function luogo(): BelongsTo
    {
        return $this->belongsTo(Luogo::class);
    }

    public function persone(): BelongsToMany
    {
        return $this->belongsToMany(Persona::class, 'evento_persona');
    }

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }
}
