<?php

namespace Tests\Feature;

use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IkmSurveyStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_survey_config_and_summary_return_dynamic_stats(): void
    {
        // 1. Initial seeded baseline (38 respondents: 23 sangat, 8 cukup, 7 kurang)
        $res = $this->getJson('/api/v1/surveys/config');
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.stats.total_responden', 38)
            ->assertJsonPath('data.stats.sangat', 61)
            ->assertJsonPath('data.stats.cukup', 21)
            ->assertJsonPath('data.stats.kurang', 18);

        // 2. Clear and test custom data
        Survey::query()->truncate();
        for ($i = 0; $i < 6; $i++) {
            Survey::query()->create([
                'nama_responden' => "User Sangat $i",
                'ikm_score' => 95.0,
                'jenis_layanan' => 'Layanan Publik',
                'u1_persyaratan' => 5, 'u2_prosedur' => 5, 'u3_kecepatan' => 5, 'u4_produk' => 5, 'u5_sikap' => 5,
            ]);
        }
        for ($i = 0; $i < 2; $i++) {
            Survey::query()->create([
                'nama_responden' => "User Cukup $i",
                'ikm_score' => 70.0,
                'jenis_layanan' => 'Layanan Publik',
                'u1_persyaratan' => 4, 'u2_prosedur' => 3, 'u3_kecepatan' => 3, 'u4_produk' => 4, 'u5_sikap' => 4,
            ]);
        }
        for ($i = 0; $i < 2; $i++) {
            Survey::query()->create([
                'nama_responden' => "User Kurang $i",
                'ikm_score' => 45.0,
                'jenis_layanan' => 'Layanan Publik',
                'u1_persyaratan' => 2, 'u2_prosedur' => 2, 'u3_kecepatan' => 2, 'u4_produk' => 3, 'u5_sikap' => 2,
            ]);
        }

        $res2 = $this->getJson('/api/v1/surveys/config');
        $res2->assertOk()
            ->assertJsonPath('data.stats.total_responden', 10)
            ->assertJsonPath('data.stats.sangat', 60)
            ->assertJsonPath('data.stats.cukup', 20)
            ->assertJsonPath('data.stats.kurang', 20);

        $summaryRes = $this->getJson('/api/v1/surveys/summary');
        $summaryRes->assertOk()
            ->assertJsonPath('data.stats.total_responden', 10)
            ->assertJsonPath('data.stats.sangat', 60);
    }

    public function test_quick_rate_endpoint_saves_response_and_recalculates_stats(): void
    {
        Survey::query()->truncate();

        $response = $this->postJson('/api/v1/surveys/quick', [
            'rating' => 'sangat',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.rating', 'sangat')
            ->assertJsonPath('data.stats.total_responden', 1)
            ->assertJsonPath('data.stats.sangat', 100);

        // Submit another quick rating: 'kurang' with feedback
        $resKurang = $this->postJson('/api/v1/surveys/quick', [
            'rating' => 'kurang',
            'feedback' => 'Informasi dokumen perlu diperbarui lebih cepat',
        ]);

        $resKurang->assertStatus(201)
            ->assertJsonPath('data.stats.total_responden', 2)
            ->assertJsonPath('data.stats.sangat', 50)
            ->assertJsonPath('data.stats.kurang', 50);

        $this->assertDatabaseHas('surveys', [
            'jenis_layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA',
        ]);
    }
}
