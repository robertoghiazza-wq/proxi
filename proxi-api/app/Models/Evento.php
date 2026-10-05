<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Evento extends Model
{
    use Auditable;

    protected $table = 'eventi';

    protected $fillable = [
        'institution_id', 'educatore_id', 'luogo_id',
        'tipo', 'data', 'ora_inizio', 'durata_min', 'stato', 'note',
    ];

    protected $casts = [
        'data'       => 'date:Y-m-d',
        'durata_min' => 'integer',
    ];

    // MySQL TIME restituisce HH:MM:SS — tronca a HH:MM
    public function getOraInizioAttribute(?string $value): ?string
    {
        return $value ? substr($value, 0, 5) : null;
    }

    protected function auditExtraOnDelete(): array
    {
        return ['persone_ids' => $this->persone()->pluck('persone.id')->all()];
    }

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
