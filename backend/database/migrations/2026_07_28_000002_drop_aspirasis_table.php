<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('aspirasis');
    }

    public function down(): void
    {
        Schema::create('aspirasis', function (Blueprint $table) {
            $table->id();
            $table->string('resi_number')->unique();
            $table->string('nama_warga');
            $table->string('nik');
            $table->string('email');
            $table->string('telepon');
            $table->string('kecamatan');
            $table->string('kategori');
            $table->string('judul');
            $table->text('isi_uraian');
            $table->tinyInteger('status_step')->default(1);
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });
    }
};
