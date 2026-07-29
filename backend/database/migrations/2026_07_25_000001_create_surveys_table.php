<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('nama_responden')->nullable();
            $table->string('email')->nullable();
            $table->string('pekerjaan')->nullable();
            $table->string('jenis_layanan')->default('Perencanaan & Informasi BAPPEDA');
            $table->integer('u1_persyaratan')->default(5);
            $table->integer('u2_prosedur')->default(5);
            $table->integer('u3_kecepatan')->default(5);
            $table->integer('u4_produk')->default(5);
            $table->integer('u5_sikap')->default(5);
            $table->decimal('ikm_score', 5, 2)->default(100.00);
            $table->text('saran_masukan')->nullable();
            $table->timestamps();
        });

        Schema::create('kritiks', function (Blueprint $table) {
            $table->id();
            $table->string('nama')->nullable();
            $table->string('email')->nullable();
            $table->string('telepon')->nullable();
            $table->string('skpd_tujuan')->default('BAPPEDA Halmahera Utara');
            $table->string('subjek');
            $table->text('pesan');
            $table->string('status')->default('Menunggu Tanggapan');
            $table->text('catatan_balasan')->nullable();
            $table->timestamps();
        });

        // Seed realistic initial survey entries in database
        DB::table('surveys')->insert([
            [
                'nama_responden' => 'Drs. M. Tani',
                'email' => 'mtani@halutkab.go.id',
                'pekerjaan' => 'ASN Perangkat Daerah',
                'jenis_layanan' => 'Layanan Konsultasi RKPD & Perencanaan Daerah',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 5,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 100.00,
                'saran_masukan' => 'Proses verifikasi dokumen usulan sangat cepat dan responsif.',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'nama_responden' => 'Sarah M. Pdt',
                'email' => 'sarah.m@gmail.com',
                'pekerjaan' => 'Wiraswasta / Masyarakat',
                'jenis_layanan' => 'Pelayanan Informasi Publik & GIS Peta Spasial',
                'u1_persyaratan' => 4,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 4,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 92.00,
                'saran_masukan' => 'Sistem peta digital sangat membantu dalam konsultasi tata ruang.',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'nama_responden' => 'Ir. Thomas S. Lesnussa',
                'email' => 'thomas.lesnussa@gmail.com',
                'pekerjaan' => 'Konsultan Pembangunan',
                'jenis_layanan' => 'Bidang Perencanaan Pembangunan & Evaluasi',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 4,
                'u3_kecepatan' => 5,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 96.00,
                'saran_masukan' => 'Pelayanan petugas di kantor BAPPEDA sangat ramah dan kooperatif.',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3),
            ],
            [
                'nama_responden' => 'Dra. Maria S. Pdt',
                'email' => 'maria.pdt@halutkab.go.id',
                'pekerjaan' => 'Masyarakat Umum',
                'jenis_layanan' => 'Sekretariat BAPPEDA',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 4,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 96.00,
                'saran_masukan' => 'Aspirasi Musrenbang dapat dilacak dengan transparan.',
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(4),
            ],
        ]);

        DB::table('kritiks')->insert([
            [
                'nama' => 'Dr. Robby H.',
                'email' => 'robby.h@gmail.com',
                'telepon' => '081234567890',
                'skpd_tujuan' => 'BAPPEDA Halmahera Utara (Kantor Utama)',
                'subjek' => 'Apresiasi Transparansi Data Pembangunan GIS',
                'pesan' => 'Visualisasi peta spasial sangat bagus dan memudahkan analisis kewilayahan.',
                'status' => 'Sudah Ditanggapi',
                'catatan_balasan' => 'Terima kasih atas apresiasinya. Kami terus memperbarui data GIS spasial secara berkala.',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'nama' => 'Mariana S. Lesnussa',
                'email' => 'mariana.lesnussa@gmail.com',
                'telepon' => '082198765432',
                'skpd_tujuan' => 'Layanan Informasi Publik & GIS Peta Spasial',
                'subjek' => 'Masukan Peningkatan Akses Peta Spasial Publik',
                'pesan' => 'Mohon ditambahkan layer peta zonasi kawasan perikanan Halmahera Utara.',
                'status' => 'Menunggu Tanggapan',
                'catatan_balasan' => null,
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5),
            ],
            [
                'nama' => 'Hendra P. Tani',
                'email' => 'hendra.tani@halutkab.go.id',
                'telepon' => '081344556677',
                'skpd_tujuan' => 'Bidang Perencanaan Pembangunan & Evaluasi',
                'subjek' => 'Usulan Fitur Pengunduhan Laporan Dokumen RKPD',
                'pesan' => 'Saran agar dokumen RKPD tahunan dapat diunduh secara langsung format PDF.',
                'status' => 'Menunggu Tanggapan',
                'catatan_balasan' => null,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('kritiks');
    }
};
