<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('survey_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed initial dummy data directly in database
        DB::table('survey_questions')->insert([
            [
                'title' => 'Kejelasan Persyaratan Pelayanan',
                'description' => 'Keselarasan persyaratan pelayanan dengan jenis pelayanannya.',
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Kemudahan Prosedur & Alur Pelayanan',
                'description' => 'Kemudahan tahapan pelayanan yang diberikan kepada masyarakat.',
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Kecepatan Waktu Pelayanan',
                'description' => 'Target waktu penyelesaian pelayanan sesuai standar yang ditetapkan.',
                'order_index' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Kualitas Produk / Informasi Hasil Layanan',
                'description' => 'Kesesuaian hasil pelayanan dengan dokumen/informasi yang dijanjikan.',
                'order_index' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Sikap & Keramahan Petugas BAPPEDA',
                'description' => 'Kematangan, kesopanan, dan kesiapan petugas dalam merespons publik.',
                'order_index' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('survey_services')->insert([
            ['name' => 'BAPPEDA Halmahera Utara (Kantor Utama)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bidang Perencanaan Pembangunan & Evaluasi', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bidang Pembangunan Manusia & Masyarakat (PMM)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bidang Ekonomi & Sumber Daya Alam (SDA)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bidang Infrastruktur & Pengembangan Wilayah (IPW)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bidang Pengendalian, Evaluasi & Pelaporan (PEP)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sekretariat BAPPEDA', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Layanan Informasi Publik & GIS Peta Spasial', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('survey_services');
    }
};
