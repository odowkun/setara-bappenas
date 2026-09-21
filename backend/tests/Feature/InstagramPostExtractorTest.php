<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstagramPostExtractorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_access_instagram_extractor(): void
    {
        $response = $this->postJson('/api/v1/instagram/extract-post', [
            'url' => 'https://www.instagram.com/p/DFWxyz123/',
        ]);

        $response->assertUnauthorized();
    }

    public function test_invalid_url_is_rejected(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        // Not an Instagram URL
        $response = $this->postJson('/api/v1/instagram/extract-post', [
            'url' => 'https://example.com/not-instagram',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_successful_instagram_post_extraction(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $shortcode = 'DFWxyz123';
        $fakeHtml = <<<HTML
        <!DOCTYPE html>
        <html>
        <body>
            <img class="EmbeddedMediaImage" src="https://scontent.cdninstagram.com/v/fake-img.jpg" />
            <div class="Caption">
                <a class="CaptionUsername" href="https://instagram.com/bappeda_halut">bappeda_halut</a>
                <br /><br />
                ✨ Harmonisasi Tata Ruang dan Pengendalian Wilayah Pesisir Halmahera Utara<br /><br />
                BAPPEDA Kabupaten Halmahera Utara menyelenggarakan rapat koordinasi penataan kawasan pesisir.
            </div>
            <time datetime="2026-09-18">18 September 2026</time>
        </body>
        </html>
        HTML;

        $fakeImageBytes = 'fake-binary-image-data-here-more-than-one-thousand-bytes-' . str_repeat('A', 1100);

        Http::fake([
            "https://www.instagram.com/p/{$shortcode}/embed/captioned/" => Http::response($fakeHtml, 200),
            'https://scontent.cdninstagram.com/*' => Http::response($fakeImageBytes, 200),
        ]);

        $response = $this->postJson('/api/v1/instagram/extract-post', [
            'url' => "https://www.instagram.com/p/{$shortcode}/?utm_source=ig_web_copy_link",
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.shortcode', $shortcode)
            ->assertJsonPath('data.category', 'SPASIAL & LINGKUNGAN')
            ->assertJsonPath('data.author', 'bappeda_halut');

        $data = $response->json('data');
        $this->assertNotEmpty($data['title']);
        $this->assertStringContainsString('Harmonisasi Tata Ruang', $data['title']);
        $this->assertStringContainsString('rapat koordinasi penataan kawasan pesisir', $data['caption']);
        $this->assertNotEmpty($data['images']);
        $this->assertStringStartsWith('/storage/instagram/', $data['images'][0]);
    }
}
