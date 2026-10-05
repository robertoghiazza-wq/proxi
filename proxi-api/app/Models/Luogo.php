<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Luogo extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'luoghi';

    protected $fillable = [
        'institution_id', 'nome', 'tipo', 'indirizzo',
        'orari', 'note', 'lat', 'lng', 'attivo',
        'npa', 'localita', 'comune_politico', 'bfs', 'cantone',
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

    public function scopeWithStats($query)
    {
        $persone = DB::table('evento_persona')
            ->join('eventi', 'eventi.id', '=', 'evento_persona.evento_id')
            ->whereColumn('eventi.luogo_id', 'luoghi.id')
            ->selectRaw('count(distinct evento_persona.persona_id)');

        return $query
            ->select('luoghi.*')
            ->selectSub($persone, 'persone_count')
            ->withCount([
                'eventi as eventi_settimana' => fn ($q) => $q->where('data', '>=', now()->subDays(7)->toDateString()),
                'eventi as eventi_totali',
            ]);
    }

    public function scopeAttivi($query)
    {
        return $query->where('attivo', true);
    }
}
