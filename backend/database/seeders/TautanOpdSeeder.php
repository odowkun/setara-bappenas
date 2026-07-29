<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TautanOpdSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            'SIPD',
            'ANJAB',
            'e-LOKET',
            'SIMWASTER',
            'CSIRT',
            'SIM ASN',
            'e-SKP',
            'Clara',
            'WEBMAIL',
            'SI-FEDORA',
            'ABSENSI',
            'SPBE',
        ];

        foreach ($items as $index => $name) {
            DB::table('tautan_opds')->updateOrInsert(
                ['name' => $name],
                [
                    'logo_url' => '/images/bappeda/logo-halut.png',
                    'url' => null,
                    'order_index' => $index + 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
