<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('infografis', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->string('category', 100)->default('Perencanaan');
            $table->string('image_url', 1000);
            $table->text('description')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_published')->default(true);
            $table->integer('order_index')->default(0);
            $table->unsignedBigInteger('view_count')->default(0);
            $table->string('created_by', 100)->nullable()->default('Admin');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['is_published', 'is_pinned', 'order_index']);
        });

        // Seed 5 initial high-quality infographics for Halut
        $now = now();
        $seeds = [
            [
                'title' => 'Indikator Makro Pembangunan Halmahera Utara: Pertumbuhan Ekonomi & Pengentasan Kemiskinan',
                'slug' => 'indikator-makro-pembangunan-halut',
                'category' => 'Ekonomi',
                'image_url' => '/images/bappeda/fgd-keuangan.png',
                'description' => 'Visualisasi capaian pertumbuhan ekonomi daerah, penurunan angka kemiskinan ekstrem, dan laju inflasi terkendali di Kabupaten Halmahera Utara.',
                'is_pinned' => true,
                'is_published' => true,
                'order_index' => 1,
                'view_count' => 128,
                'created_by' => 'SuperAdmin',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Arah Kebijakan RPJPD Halmahera Utara 2025–2045: Menuju Halut Maju, Mandiri & Berkelanjutan',
                'slug' => 'arah-kebijakan-rpjpd-halut-2025-2045',
                'category' => 'Perencanaan',
                'image_url' => '/images/bappeda/kantor-bappeda.png',
                'description' => 'Peta jalan 20 tahun pembangunan daerah yang menyelaraskan sasaran pokok nasional (RPJPN) dengan potensi kepulauan dan agromaritim Halut.',
                'is_pinned' => true,
                'is_published' => true,
                'order_index' => 2,
                'view_count' => 215,
                'created_by' => 'SuperAdmin',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Sebaran & Monitoring Spasial Titik Proyek Strategis Daerah Berbasis WebGIS',
                'slug' => 'sebaran-spasial-proyek-strategis-webgis',
                'category' => 'Spasial',
                'image_url' => '/images/bappeda/peta-spasial.png',
                'description' => 'Pemetaan geospasial realisasi fisik infrastruktur, jalan jembatan, irigasi, dan sanitasi permukiman di seluruh kecamatan Halmahera Utara.',
                'is_pinned' => true,
                'is_published' => true,
                'order_index' => 3,
                'view_count' => 342,
                'created_by' => 'SuperAdmin',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Strategi Terpadu Percepatan Penurunan Stunting & Peningkatan Gizi Keluarga',
                'slug' => 'strategi-terpadu-penurunan-stunting-halut',
                'category' => 'Kesehatan',
                'image_url' => '/images/bappeda/fgd-keuangan.png',
                'description' => 'Intervensi spesifik dan sensitif pencegahan stunting melalui kolaborasi lintas dinas kesehatan, dinas sosial, dan pemerintah desa.',
                'is_pinned' => true,
                'is_published' => true,
                'order_index' => 4,
                'view_count' => 189,
                'created_by' => 'SuperAdmin',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Postur Transparansi Realisasi APBD Kabupaten Halmahera Utara',
                'slug' => 'postur-transparansi-apbd-halut',
                'category' => 'Anggaran',
                'image_url' => '/images/bappeda/kantor-bappeda.png',
                'description' => 'Ringkasan visual alokasi belanja modal, transfer ke daerah, dan pendapatan asli daerah (PAD) untuk akselerasi pelayanan publik.',
                'is_pinned' => true,
                'is_published' => true,
                'order_index' => 5,
                'view_count' => 97,
                'created_by' => 'SuperAdmin',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('infografis')->insert($seeds);
    }

    public function down(): void
    {
        Schema::dropIfExists('infografis');
    }
};
