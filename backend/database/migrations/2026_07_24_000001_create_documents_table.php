<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('jenis'); // rpjpd, rpjmd, rkpd, lkpj, renstra, renja, data_sektoral
            $table->string('bidang')->default('semua'); // semua, infrastruktur, perekonomian, sosbud, renval
            $table->string('tahun');
            $table->string('ukuran')->default('2.5 MB');
            $table->integer('downloads')->default(0);
            $table->string('file_path')->nullable();
            $table->boolean('is_public')->default(true);
            $table->string('uploaded_by');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
