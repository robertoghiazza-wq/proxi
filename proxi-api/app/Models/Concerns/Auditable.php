<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Support\Arr;

trait Auditable
{
    protected ?array $auditSnapshot = null;

    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditLog::record('created', $model, null, $model->auditable($model->getAttributes()));
        });

        static::updated(function ($model) {
            $changes = $model->auditable($model->getChanges());
            if (! $changes) {
                return;
            }
            $old = Arr::only($model->getOriginal(), array_keys($changes));
            AuditLog::record('updated', $model, $old, $changes);
        });

        static::deleting(function ($model) {
            $model->auditSnapshot = $model->auditable($model->getAttributes()) + $model->auditExtraOnDelete();
        });

        static::deleted(function ($model) {
            AuditLog::record('deleted', $model, $model->auditSnapshot ?? $model->auditable($model->getAttributes()));
        });
    }

    protected function auditable(array $attributes): array
    {
        return Arr::except($attributes, array_merge(
            $this->getHidden(),
            ['password', 'remember_token', 'created_at', 'updated_at'],
        ));
    }

    // Dati collegati che il DB cancella a cascata e che vanno salvati prima.
    protected function auditExtraOnDelete(): array
    {
        return [];
    }
}
