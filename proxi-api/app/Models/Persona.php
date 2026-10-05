<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Persona extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'persone';

    protected $fillable = [
        'institution_id', 'ruolo', 'nome', 'soprannome', 'anonimo',
        'eta', 'sesso', 'lingue', 'tag', 'bisogni', 'note',
        'telefono', 'email',
    ];

    protected $casts = [
        'anonimo' => 'boolean',
        'lingue'  => 'array',
        'tag'     => 'array',
        'bisogni' => 'array',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function eventi(): BelongsToMany
    {
        return $this->belongsToMany(Evento::class, 'evento_persona');
    }

    public function servizi(): BelongsToMany
    {
        return $this->belongsToMany(Servizio::class, 'persona_servizio')
            ->withPivot('ruolo', 'principale');
    }

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }
}
