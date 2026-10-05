<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    use Auditable;

    protected $fillable = ['nome', 'slug', 'email', 'attiva'];

    protected $casts = ['attiva' => 'boolean'];

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
