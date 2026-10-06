<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vocabolo extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'vocaboli';

    protected $fillable = ['institution_id', 'categoria', 'valore', 'ordine', 'attivo'];

    protected $casts = ['attivo' => 'boolean', 'ordine' => 'integer'];

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }
}
