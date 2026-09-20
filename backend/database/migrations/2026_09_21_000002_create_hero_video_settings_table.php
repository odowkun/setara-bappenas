<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_video_settings', function (Blueprint $table) {
            $table->id();
            $table->string('video_url', 1000)->default('/videos/sambutan-bappenas.mp4');
            $table->string('poster_url', 1000)->nullable()->default('/images/bappeda/fgd-keuangan.png');
            $table->string('badge_title', 100)->nullable()->default('VIDEO SAMBUTAN PEMBUKAAN');
            $table->string('badge_subtitle', 100)->nullable()->default('Pembangunan Halut 2026');
            $table->string('title', 255)->default('Sambutan & Arah Kebijakan Pembangunan');
            $table->text('subtitle')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('updated_by', 100)->nullable();
            $table->timestamps();
        });

        DB::table('hero_video_settings')->insert([
            'video_url' => '/videos/sambutan-bappenas.mp4',
            'poster_url' => '/images/bappeda/fgd-keuangan.png',
            'badge_title' => 'VIDEO SAMBUTAN PEMBUKAAN',
            'badge_subtitle' => 'Pembangunan Halut 2026',
            'title' => 'Sambutan & Arah Kebijakan Pembangunan',
            'subtitle' => 'Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara.',
            'is_active' => true,
            'updated_by' => 'SuperAdmin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_video_settings');
    }
};
