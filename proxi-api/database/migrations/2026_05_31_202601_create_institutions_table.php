<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('accent_color', 7)->default('#dc1d27');
            $table->string('logo_path')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('role', ['educatore', 'coordinatore', 'admin', 'superadmin'])->default('educatore');
            $table->json('lingue')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
            $table->dropColumn(['institution_id', 'role', 'lingue']);
        });
        Schema::dropIfExists('institutions');
    }
};
