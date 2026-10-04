<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Luogo extends Model
{
    use SoftDeletes;

    protected $table = 'luoghi';

    protected $fillable = [
        'institution_id', 'nome', 'tipo', 'indirizzo',
        'orari', 'note', 'lat', 'lng', 'attivo',
    ];

    protected $casts = [
        'lat'    => 'float',
        'lng'    => 'float',
        'attivo' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function eventi(): HasMany
    {
        return $this->hasMany(Evento::class);
    }

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    public function scopeAttivi($query)
    {
        return $query->where('attivo', true);
    }
}
