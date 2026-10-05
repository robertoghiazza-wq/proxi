<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Throwable;

class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'institution_id', 'user_id', 'action', 'auditable_type', 'auditable_id',
        'old_values', 'new_values', 'meta', 'ip', 'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'meta'       => 'array',
    ];

    // Il log è append-only: nessuna modifica né cancellazione.
    protected static function booted(): void
    {
        static::updating(fn () => false);
        static::deleting(fn () => false);
    }

    public static function record(
        string $action,
        Model $model,
        ?array $old = null,
        ?array $new = null,
        ?array $meta = null,
    ): void {
        try {
            $user = request()->user() ?? ($model instanceof User ? $model : null);

            $institutionId = $model instanceof Institution
                ? $model->id
                : ($model->institution_id ?? $user?->institution_id);

            static::create([
                'institution_id' => $institutionId,
                'user_id'        => $user?->id,
                'action'         => $action,
                'auditable_type' => class_basename($model),
                'auditable_id'   => $model->getKey(),
                'old_values'     => $old,
                'new_values'     => $new,
                'meta'           => $meta,
                'ip'             => request()->ip(),
                'user_agent'     => mb_substr((string) request()->userAgent(), 0, 255) ?: null,
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
