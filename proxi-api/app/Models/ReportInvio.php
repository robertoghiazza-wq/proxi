<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportInvio extends Model
{
    protected $table = 'report_invii';

    protected $fillable = ['institution_id', 'user_id', 'tipo', 'riferimento', 'destinatari', 'nomi', 'racconto', 'con_pdf', 'esito', 'dettaglio'];

    protected $casts = ['destinatari' => 'array', 'racconto' => 'boolean', 'con_pdf' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
