<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonaDocumento extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'persona_documenti';

    protected $fillable = [
        'institution_id', 'persona_id', 'tipo', 'titolo', 'note',
        'percorso', 'nome_originale', 'mime', 'dimensione', 'caricato_da',
    ];

    // Il percorso sul disco non esce mai dall'API
    protected $hidden = ['percorso'];

    protected $casts = ['dimensione' => 'integer'];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }

    public function autore(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caricato_da');
    }
}
