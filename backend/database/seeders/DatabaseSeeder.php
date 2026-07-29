<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PejabatSeeder::class,
            ProfilSeeder::class,
            SurveySeeder::class,
            DocumentSeeder::class,
            ProyekDetailSeeder::class,
            NewsSeeder::class,
            GaleriSeeder::class,
            DashboardChartSeeder::class,
            TautanOpdSeeder::class,
        ]);
    }
}
