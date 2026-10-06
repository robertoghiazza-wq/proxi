<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonaDiario extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'persona_diario';

    protected $fillable = ['institution_id', 'persona_id', 'data', 'autore_id', 'nota'];

    protected $casts = ['data' => 'date:Y-m-d'];

    public function autore(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autore_id');
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }
}
