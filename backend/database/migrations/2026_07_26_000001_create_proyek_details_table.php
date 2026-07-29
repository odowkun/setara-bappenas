<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyek_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->string('kode_proyek')->unique();
            $table->string('nama_proyek');
            $table->string('bidang')->default('infrastruktur');
            $table->string('kecamatan')->nullable();
            $table->string('desa_kelurahan')->nullable();
            $table->text('lokasi_deskripsi')->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->unsignedBigInteger('esri_objectid')->nullable();
            $table->decimal('pagu_anggaran', 15, 2)->default(0);
            $table->decimal('realisasi_anggaran', 15, 2)->default(0);
            $table->integer('persentase_progres')->default(0);
            $table->string('status_progres')->default('belum_mulai'); // belum_mulai, dalam_proses, selesai, terkendala
            $table->string('opd_penanggung_jawab')->nullable();
            $table->string('created_by')->default('Admin');
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proyek_details');
    }
};
