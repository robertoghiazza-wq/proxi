<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Persona extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'persone';

    protected $fillable = [
        'institution_id', 'ruolo', 'nome', 'cognome', 'soprannome', 'anonimo', 'data_nascita', 'ruolo_id',
        'indirizzo', 'npa', 'localita', 'comune_politico', 'bfs', 'cantone', 'paese', 'note_contatti',
        'eta', 'sesso', 'lingue', 'tag', 'bisogni', 'note',
        'telefono', 'email',
    ];

    protected $appends = ['eta'];

    protected $casts = [
        'anonimo' => 'boolean',
        'data_nascita' => 'date:Y-m-d',
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

    // Con la data di nascita l'età è calcolata; altrimenti vale il dato approssimato inserito a mano.
    public function getEtaAttribute($value): ?int
    {
        return $this->data_nascita ? (int) $this->data_nascita->diffInYears(now()) : ($value === null ? null : (int) $value);
    }

    public function telefoni(): HasMany
    {
        return $this->hasMany(PersonaTelefono::class)->orderBy('ordine');
    }

    public function account(): HasOne
    {
        return $this->hasOne(User::class, 'persona_id');
    }

    public function contratti(): HasMany
    {
        return $this->hasMany(PersonaContratto::class)->orderByDesc('data_inizio');
    }

    public function profilo(): HasOne
    {
        return $this->hasOne(PersonaProfilo::class);
    }

    public function sostanze(): HasMany
    {
        return $this->hasMany(PersonaSostanza::class)->orderBy('ordine');
    }

    public function diario(): HasMany
    {
        return $this->hasMany(PersonaDiario::class)->orderByDesc('data')->orderByDesc('id');
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
