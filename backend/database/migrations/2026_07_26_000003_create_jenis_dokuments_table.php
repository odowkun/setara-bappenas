<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_dokuments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('scope_role', ['admin_umum', 'admin_bidang', 'semua'])->default('semua');
            $table->boolean('is_default')->default(false);
            $table->string('created_by')->default('SuperAdmin');
            $table->timestamps();
        });

        // Seed Jenis Dokumen Master (Dianggap dibuat oleh SuperAdmin ke Database)
        DB::table('jenis_dokuments')->insert([
            // Admin Umum
            ['name' => 'Rencana Pembangunan Jangka Panjang Daerah (RPJPD)', 'code' => 'rpjpd', 'scope_role' => 'admin_umum', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rencana Pembangunan Jangka Menengah Daerah (RPJMD)', 'code' => 'rpjmd', 'scope_role' => 'admin_umum', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rencana Kerja Pemerintah Daerah (RKPD)', 'code' => 'rkpd', 'scope_role' => 'admin_umum', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Laporan Keterangan Pertanggungjawaban (LKPJ)', 'code' => 'lkpj', 'scope_role' => 'admin_umum', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],

            // Admin Bidang
            ['name' => 'Rencana Strategis (Renstra)', 'code' => 'renstra', 'scope_role' => 'admin_bidang', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rencana Kerja (Renja)', 'code' => 'renja', 'scope_role' => 'admin_bidang', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Dik. Sektoral', 'code' => 'dik_sektoral', 'scope_role' => 'admin_bidang', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Data Sektoral', 'code' => 'data_sektoral', 'scope_role' => 'admin_bidang', 'is_default' => false, 'created_by' => 'SuperAdmin', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('jenis_dokuments');
    }
};
