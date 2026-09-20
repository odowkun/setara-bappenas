<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('running_texts', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->string('tag')->default('PENGUMUMAN');
            $table->string('url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // Seed initial official running texts
        DB::table('running_texts')->insert([
            [
                'content' => 'Publikasi Dokumen RPJPD Kabupaten Halmahera Utara Tahun 2025–2045: Menuju Halut Maju, Mandiri & Berkelanjutan',
                'tag' => 'RPJPD',
                'url' => '/dokumen?jenis=RPJPD',
                'is_active' => true,
                'order_index' => 1,
                'created_by' => 'SuperAdmin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'PERDA No. 6 Tahun 2025 Tentang RPJMD Kabupaten Halmahera Utara Tahun 2025–2029',
                'tag' => 'RPJMD',
                'url' => '/dokumen?jenis=RPJMD',
                'is_active' => true,
                'order_index' => 2,
                'created_by' => 'SuperAdmin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'PERBUB No. 38 Tahun 2025 Tentang RKPD Kab. Halmahera Utara Tahun 2026',
                'tag' => 'RKPD',
                'url' => '/dokumen?jenis=RKPD',
                'is_active' => true,
                'order_index' => 3,
                'created_by' => 'SuperAdmin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'content' => 'Sinkronisasi Peta Geospasial Spasial & Pemantauan Titik Proyek Strategis BAPPEDA Halmahera Utara',
                'tag' => 'WEBGIS',
                'url' => '/gis-peta',
                'is_active' => true,
                'order_index' => 4,
                'created_by' => 'SuperAdmin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('running_texts');
    }
};
