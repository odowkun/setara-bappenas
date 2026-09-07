<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add extra spatial configuration columns to geo_settings
        Schema::table('geo_settings', function (Blueprint $table) {
            $table->integer('default_buffer_radius_meter')->default(1000)->after('default_fill_opacity');
            $table->string('buffer_color', 50)->default('#7c3aed')->after('default_buffer_radius_meter');
            $table->decimal('buffer_opacity', 3, 2)->default(0.35)->after('buffer_color');
            $table->json('sector_pin_colors_json')->nullable()->after('buffer_opacity');
            $table->json('print_layout_config_json')->nullable()->after('sector_pin_colors_json');
        });

        // Set default values for initial record
        DB::table('geo_settings')->where('id', 1)->update([
            'default_buffer_radius_meter' => 1000,
            'buffer_color' => '#7c3aed',
            'buffer_opacity' => 0.35,
            'sector_pin_colors_json' => json_encode([
                'pupr' => '#2563eb',
                'kesehatan' => '#e11d48',
                'pendidikan' => '#7c3aed',
                'perhubungan' => '#d97706',
                'bappeda' => '#059669',
            ]),
            'print_layout_config_json' => json_encode([
                'map_title' => 'PETA SEBARAN PROYEK STRATEGIS KABUPATEN HALMAHERA UTARA',
                'map_subtitle' => 'Dokumen Resmi Perencanaan Pembangunan Daerah Bappeda Pemkab Halut',
                'show_logo' => true,
                'show_compass' => true,
                'show_legend' => true,
                'paper_size' => 'A4',
                'orientation' => 'landscape',
                'export_format' => 'pdf',
            ]),
        ]);

        // 2. Create spatial_layers table for master secondary layers (Kecamatan, Desa, Zona RTRW)
        Schema::create('spatial_layers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type', 50)->default('kecamatan'); // kabupaten, kecamatan, rtrw
            $table->string('legal_basis')->nullable();
            $table->integer('feature_count')->default(1);
            $table->string('color', 50)->default('#0284c7');
            $table->boolean('visible')->default(true);
            $table->string('file_name')->nullable();
            $table->string('file_path', 1000)->nullable();
            $table->mediumText('geojson')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // Seed initial official layers
        DB::table('spatial_layers')->insert([
            [
                'name' => 'Batas Sub-Wilayah Kecamatan (Tobelo, Galela, Kao)',
                'type' => 'kecamatan',
                'legal_basis' => 'Perda Halut No. 3 Tahun 2020',
                'feature_count' => 5,
                'color' => '#0284c7',
                'visible' => true,
                'file_name' => 'batas_kecamatan_halut.geojson',
                'created_by' => 'System Administrator',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Zona Overlay Peruntukan RTRW (Hutan Lindung & Pemukiman)',
                'type' => 'rtrw',
                'legal_basis' => 'Perda RTRW Halut No. 5 Tahun 2022',
                'feature_count' => 4,
                'color' => '#059669',
                'visible' => true,
                'file_name' => 'pola_ruang_rtrw_halut.geojson',
                'created_by' => 'System Administrator',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('spatial_layers');

        Schema::table('geo_settings', function (Blueprint $table) {
            $table->dropColumn([
                'default_buffer_radius_meter',
                'buffer_color',
                'buffer_opacity',
                'sector_pin_colors_json',
                'print_layout_config_json',
            ]);
        });
    }
};
