<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ruolo extends Model
{
    use Auditable, SoftDeletes;

    protected $table = 'ruoli';

    protected $fillable = ['institution_id', 'nome_m', 'nome_f', 'nome_misto', 'ordine', 'attivo'];

    protected $casts = ['attivo' => 'boolean', 'ordine' => 'integer'];

    public function scopeForInstitution($query, int $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }
}
