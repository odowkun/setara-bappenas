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
            $now = now();

            // 1. RPJMN
            $existsRpjmn = DB::table('jenis_dokuments')->where('code', 'rpjmn')->exists();
            if (!$existsRpjmn) {
                DB::table('jenis_dokuments')->insert([
                    'name' => 'Rencana Pembangunan Jangka Menengah Nasional (RPJMN)',
                    'code' => 'rpjmn',
                    'scope_role' => 'admin_umum',
                    'is_default' => false,
                    'created_by' => 'SuperAdmin',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // 2. RPJMD Prov
            $existsRpjmdProv = DB::table('jenis_dokuments')->where('code', 'rpjmd_prov')->exists();
            if (!$existsRpjmdProv) {
                DB::table('jenis_dokuments')->insert([
                    'name' => 'Rencana Pembangunan Jangka Menengah Daerah Provinsi (RPJMD Prov)',
                    'code' => 'rpjmd_prov',
                    'scope_role' => 'admin_umum',
                    'is_default' => false,
                    'created_by' => 'SuperAdmin',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // 3. RPJMD Kab
            $existsRpjmdKab = DB::table('jenis_dokuments')->where('code', 'rpjmd_kab')->exists();
            if (!$existsRpjmdKab) {
                DB::table('jenis_dokuments')->insert([
                    'name' => 'Rencana Pembangunan Jangka Menengah Daerah Kabupaten (RPJMD Kab)',
                    'code' => 'rpjmd_kab',
                    'scope_role' => 'admin_umum',
                    'is_default' => false,
                    'created_by' => 'SuperAdmin',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // Update legacy 'rpjmd' in documents table to 'rpjmd_kab'
            if (Schema::hasTable('documents')) {
                DB::table('documents')
                    ->where('jenis', 'rpjmd')
                    ->update(['jenis' => 'rpjmd_kab']);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('documents')) {
            DB::table('documents')
                ->where('jenis', 'rpjmd_kab')
                ->update(['jenis' => 'rpjmd']);
        }

        if (Schema::hasTable('jenis_dokuments')) {
            DB::table('jenis_dokuments')
                ->whereIn('code', ['rpjmn', 'rpjmd_prov', 'rpjmd_kab'])
                ->delete();
        }
    }
};
