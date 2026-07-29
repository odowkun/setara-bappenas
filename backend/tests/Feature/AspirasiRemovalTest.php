<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AspirasiRemovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_aspirasi_feature_is_no_longer_available(): void
    {
        $this->assertFalse(Schema::hasTable('aspirasis'));

        $this->getJson('/api/v1/aspirasis')->assertNotFound();
        $this->postJson('/api/v1/proposals/aspirasi')->assertNotFound();
    }
}
