<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroVideoSetting extends Model
{
    protected $table = 'hero_video_settings';

    protected $fillable = [
        'video_url',
        'poster_url',
        'badge_title',
        'badge_subtitle',
        'title',
        'subtitle',
        'is_active',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function getActiveSetting(): self
    {
        $setting = static::first();

        if (! $setting) {
            $setting = static::create([
                'video_url' => '/videos/sambutan-bappenas.mp4',
                'poster_url' => '/images/bappeda/fgd-keuangan.png',
                'badge_title' => 'VIDEO SAMBUTAN PEMBUKAAN',
                'badge_subtitle' => 'Pembangunan Halut 2026',
                'title' => 'Sambutan & Arah Kebijakan Pembangunan',
                'subtitle' => 'Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara.',
                'is_active' => true,
                'updated_by' => 'System',
            ]);
        }

        return $setting;
    }
}
