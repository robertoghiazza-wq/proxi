<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $prometheus = Institution::firstOrCreate(
            ['slug' => 'prometheus'],
            [
                'name'         => 'Associazione Prometheus',
                'accent_color' => '#dc1d27',
                'active'       => true,
            ]
        );

        // Admin
        User::firstOrCreate(
            ['email' => 'admin@associazioneprometheus.ch'],
            [
                'name'           => 'Admin Prometheus',
                'password'       => Hash::make('changeme'),
                'institution_id' => $prometheus->id,
                'role'           => 'admin',
            ]
        );

        // Educatore demo
        User::firstOrCreate(
            ['email' => 'giulia@associazioneprometheus.ch'],
            [
                'name'           => 'Giulia Ferretti',
                'password'       => Hash::make('changeme'),
                'institution_id' => $prometheus->id,
                'role'           => 'educatore',
                'lingue'         => ['italiano'],
            ]
        );
    }
}
