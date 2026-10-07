<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImpostazioneApp extends Model
{
    protected $table = 'impostazioni_app';

    protected $primaryKey = 'chiave';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['chiave', 'valore'];

    public static function leggi(string $chiave): ?string
    {
        return static::find($chiave)?->valore;
    }

    public static function imposta(string $chiave, ?string $valore): void
    {
        static::updateOrCreate(['chiave' => $chiave], ['valore' => $valore]);
    }
}
