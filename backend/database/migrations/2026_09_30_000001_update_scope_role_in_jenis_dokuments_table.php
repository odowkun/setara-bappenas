<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('jenis_dokuments')) {
            // Change scope_role to string so it can store specific bidang identifiers
            Schema::table('jenis_dokuments', function (Blueprint $table) {
                $table->string('scope_role', 50)->default('semua')->change();
            });

            // Update default document scopes to match standard BAPPEDA Halut organization
            // Dokumen bersama (semua bidang)
            DB::table('jenis_dokuments')
                ->whereIn('code', ['renstra', 'renja', 'dik_sektoral', 'data_sektoral'])
                ->update(['scope_role' => 'semua']);

            // Dokumen makro daerah (sekretariat / umum)
            DB::table('jenis_dokuments')
                ->whereIn('code', ['rpjpd', 'rpjmd', 'rpjmd_kab', 'rpjmd_prov', 'rpjmn'])
                ->update(['scope_role' => 'admin_umum']);

            // Dokumen evaluasi & pelaporan (monev / renval)
            DB::table('jenis_dokuments')
                ->whereIn('code', ['rkpd', 'lkpj'])
                ->update(['scope_role' => 'renval']);
        }
    }

    public function down(): void
    {
        // Revert scope_role values if needed
    }
};
