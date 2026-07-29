<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DashboardChartSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Realisasi APBD Monthly Trend (2026)
        DB::table('realisasi_apbd_monthly')->truncate();
        DB::table('realisasi_apbd_monthly')->insert([
            ['month' => 'Jan', 'month_order' => 1, 'keuangan' => 24.0, 'fisik' => 28.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Feb', 'month_order' => 2, 'keuangan' => 38.0, 'fisik' => 42.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Mar', 'month_order' => 3, 'keuangan' => 52.0, 'fisik' => 58.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Apr', 'month_order' => 4, 'keuangan' => 65.0, 'fisik' => 70.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Mei', 'month_order' => 5, 'keuangan' => 74.0, 'fisik' => 79.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Jun', 'month_order' => 6, 'keuangan' => 83.0, 'fisik' => 86.0, 'created_at' => now(), 'updated_at' => now()],
            ['month' => 'Jul', 'month_order' => 7, 'keuangan' => 89.0, 'fisik' => 92.0, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 2. Program Strategis Sektoral
        DB::table('program_sektoral')->truncate();
        DB::table('program_sektoral')->insert([
            [
                'sector' => 'Infrastruktur & Aksesibilitas',
                'realisasi' => 88.0,
                'target' => 90.0,
                'color' => 'bg-blue-600',
                'text_color' => 'text-blue-700',
                'order_index' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'sector' => 'Kesehatan & Penurunan Stunting',
                'realisasi' => 94.0,
                'target' => 95.0,
                'color' => 'bg-emerald-600',
                'text_color' => 'text-emerald-700',
                'order_index' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'sector' => 'Pendidikan & Sarana Keaksaraan',
                'realisasi' => 82.0,
                'target' => 88.0,
                'color' => 'bg-indigo-600',
                'text_color' => 'text-indigo-700',
                'order_index' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'sector' => 'Pertanian & Perikanan Pesisir',
                'realisasi' => 79.0,
                'target' => 85.0,
                'color' => 'bg-amber-600',
                'text_color' => 'text-amber-800',
                'order_index' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'sector' => 'Pariwisata & Ekonomi Kreatif',
                'realisasi' => 85.0,
                'target' => 87.0,
                'color' => 'bg-rose-600',
                'text_color' => 'text-rose-700',
                'order_index' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
