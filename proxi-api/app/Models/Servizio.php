<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Servizio extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'servizi';

    protected $fillable = [
        'institution_id', 'nome', 'indirizzo', 'cap', 'localita', 'paese',
        'telefono', 'email', 'sito', 'note', 'lat', 'lng', 'attivo',
    ];

    protected $attributes = ['paese' => 'Svizzera', 'attivo' => true];

    protected $casts = [
        'lat'    => 'float',
        'lng'    => 'float',
        'attivo' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function persone(): BelongsToMany
    {
        return $this->belongsToMany(Persona::class, 'persona_servizio')
            ->withPivot('ruolo', 'principale')
            ->withTimestamps();
    }

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    protected function auditExtraOnDelete(): array
    {
        return ['persone' => $this->persone()->get()->map(fn ($p) => [
            'persona_id' => $p->id, 'ruolo' => $p->pivot->ruolo, 'principale' => (bool) $p->pivot->principale,
        ])->all()];
    }
}
