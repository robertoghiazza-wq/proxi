<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    use Auditable;

    protected static function booted(): void
    {
        static::created(function (self $i) {
            \App\Support\RuoliDefault::seed($i->id);
            \App\Support\VocaboliDefault::seed($i->id);
            \App\Support\TipiDefault::seed($i->id);
        });
    }

    protected $fillable = ['nome', 'slug', 'email', 'attiva'];

    protected $casts = ['attiva' => 'boolean'];

    // Il percorso del logo non esce dall'API: si espone solo se c'è
    protected $hidden = ['logo_path'];

    protected $appends = ['ha_logo'];

    public function getHaLogoAttribute(): bool
    {
        return ! empty($this->attributes['logo_path'] ?? null);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function persone(): HasMany
    {
        return $this->hasMany(Persona::class);
    }

    public function luoghi(): HasMany
    {
        return $this->hasMany(Luogo::class);
    }

    public function eventi(): HasMany
    {
        return $this->hasMany(Evento::class);
    }
}
