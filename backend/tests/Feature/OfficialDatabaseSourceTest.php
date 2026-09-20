<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OfficialDatabaseSourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_reads_only_published_agendas_from_database(): void
    {
        $categoryId = DB::table('agenda_categories')->value('id');
        DB::table('agendas')->insert([
            [
                'agenda_category_id' => $categoryId,
                'title' => 'Agenda Resmi Publik',
                'start_at' => now()->addDay(),
                'end_at' => now()->addDays(2),
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'agenda_category_id' => $categoryId,
                'title' => 'Agenda Draf Internal',
                'start_at' => now()->addDay(),
                'end_at' => now()->addDays(2),
                'is_published' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $response = $this->getJson('/api/v1/agendas')->assertOk();
        $response->assertJsonFragment(['title' => 'Agenda Resmi Publik']);
        $response->assertJsonMissing(['title' => 'Agenda Draf Internal']);
    }

    public function test_unauthenticated_visitors_cannot_mutate_official_content(): void
    {
        $this->postJson('/api/v1/agendas', [])->assertUnauthorized();
        $this->postJson('/api/v1/pengumuman', [])->assertUnauthorized();
        $this->postJson('/api/v1/news-categories', [])->assertUnauthorized();
        $this->postJson('/api/v1/gis/geoprocessing/buffer', [])->assertUnauthorized();
    }

    public function test_authorized_admin_can_create_agenda_and_announcement_in_database(): void
    {
        $this->actingAsAdminUmum();
        $agendaCategoryId = DB::table('agenda_categories')->value('id');
        $announcementTypeId = DB::table('announcement_types')->value('id');

        $this->postJson('/api/v1/agendas', [
            'agenda_category_id' => $agendaCategoryId,
            'title' => 'Rapat Satu Data',
            'start_at' => '2026-08-01T09:00:00',
            'end_at' => '2026-08-01T11:00:00',
            'location' => 'BAPPEDA Halut',
            'organizer' => 'Sekretariat',
            'is_published' => true,
        ])->assertCreated();

        $this->postJson('/api/v1/pengumuman', [
            'announcement_type_id' => $announcementTypeId,
            'title' => 'Edaran Satu Data',
            'content' => '<p>Data resmi</p>',
            'is_published' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('agendas', ['title' => 'Rapat Satu Data']);
        $this->assertDatabaseHas('announcements', ['title' => 'Edaran Satu Data']);
    }

    public function test_expired_or_unpublished_announcements_are_not_public(): void
    {
        $typeId = DB::table('announcement_types')->value('id');
        foreach ([
            ['title' => 'Masih Berlaku', 'is_published' => true, 'valid_until' => today()->addDay()],
            ['title' => 'Sudah Kedaluwarsa', 'is_published' => true, 'valid_until' => today()->subDay()],
            ['title' => 'Masih Draf', 'is_published' => false, 'valid_until' => today()->addDay()],
        ] as $row) {
            DB::table('announcements')->insert([
                ...$row,
                'announcement_type_id' => $typeId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $response = $this->getJson('/api/v1/pengumuman')->assertOk();
        $response->assertJsonFragment(['title' => 'Masih Berlaku']);
        $response->assertJsonMissing(['title' => 'Sudah Kedaluwarsa']);
        $response->assertJsonMissing(['title' => 'Masih Draf']);

        // Pengumuman PIN selalu tampil meski tanggal berlaku lewat
        DB::table('announcements')->insert([
            'title' => 'Pengumuman Resmi Dipin',
            'is_published' => true,
            'is_important' => true,
            'valid_until' => today()->subDay(),
            'announcement_type_id' => $typeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $responseWithPin = $this->getJson('/api/v1/pengumuman')->assertOk();
        $responseWithPin->assertJsonFragment(['title' => 'Pengumuman Resmi Dipin']);

        // Parameter all=1 menampilkan seluruh arsip pengumuman yang tayang
        $responseArchive = $this->getJson('/api/v1/pengumuman?all=1')->assertOk();
        $responseArchive->assertJsonFragment(['title' => 'Sudah Kedaluwarsa']);
    }

    public function test_geoprocessing_result_is_persisted_with_an_honest_source(): void
    {
        $this->actingAsAdminUmum();

        $response = $this->postJson('/api/v1/gis/geoprocessing/buffer', [
            'name' => 'Buffer Pelayanan',
            'category' => 'kesehatan',
            'latitude' => 1.7289,
            'longitude' => 128.0054,
            'radius' => 1500,
            'color' => '#2563eb',
        ])->assertCreated();

        $response->assertJsonPath('data.result_source', 'local_calculation');
        $response->assertJsonPath('data.geojson.type', 'FeatureCollection');
        $this->assertDatabaseHas('geoprocessing_analyses', [
            'name' => 'Buffer Pelayanan',
            'result_source' => 'local_calculation',
        ]);
    }

    private function actingAsAdminUmum(): User
    {
        $user = User::factory()->create(['role' => 'admin_umum']);
        $user->assignRole('admin_umum');
        Sanctum::actingAs($user);

        return $user;
    }
}
