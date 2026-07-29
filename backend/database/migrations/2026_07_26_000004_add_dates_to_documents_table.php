<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->date('tanggal_mulai')->nullable()->after('tahun');
            $table->date('tanggal_selesai')->nullable()->after('tanggal_mulai');
            $table->foreignId('jenis_dokumen_id')->nullable()->constrained('jenis_dokuments')->onDelete('set null')->after('jenis');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['tanggal_mulai', 'tanggal_selesai', 'jenis_dokumen_id']);
        });
    }
};
