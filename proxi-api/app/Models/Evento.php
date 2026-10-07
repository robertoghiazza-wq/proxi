<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evento extends Model
{
    use Auditable;

    protected $table = 'eventi';

    protected $fillable = [
        'institution_id', 'educatore_id', 'luogo_id',
        'tipo', 'data', 'ora_inizio', 'durata_min', 'stato', 'note',
    ];

    protected $appends = ['completo', 'mancanti'];

    protected $casts = [
        'data'       => 'date:Y-m-d',
        'durata_min' => 'integer',
    ];

    // MySQL TIME restituisce HH:MM:SS — tronca a HH:MM
    public function getOraInizioAttribute(?string $value): ?string
    {
        return $value ? substr($value, 0, 5) : null;
    }

    // Campi che mancano perché l'evento sia "completo". Le note non sono
    // obbligatorie per salvare, ma contano per la completezza.
    public function getMancantiAttribute(): array
    {
        $manca = [];

        if (blank($this->tipo)) $manca[] = 'tipo';
        if (blank($this->getRawOriginal('data'))) $manca[] = 'data';
        if (blank($this->getRawOriginal('ora_inizio'))) $manca[] = 'ora';
        if (blank($this->durata_min)) $manca[] = 'durata';
        if (blank($this->luogo_id)) $manca[] = 'luogo';

        $nPersone = $this->persone_count
            ?? ($this->relationLoaded('persone') ? $this->persone->count() : $this->persone()->count());
        if ($nPersone === 0) $manca[] = 'persone';

        if (blank(trim((string) $this->note))) $manca[] = 'note';

        return $manca;
    }

    public function getCompletoAttribute(): bool
    {
        return $this->mancanti === [];
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

    // Tappe (luoghi con orario) in ordine; se mancano vale il solo luogo dell'evento
    public function soste(): HasMany
    {
        return $this->hasMany(EventoSosta::class)->orderBy('ordine')->orderBy('id');
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
