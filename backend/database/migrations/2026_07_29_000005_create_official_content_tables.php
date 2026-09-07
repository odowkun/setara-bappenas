<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color')->default('blue');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('agendas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agenda_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('location')->nullable();
            $table->string('organizer')->nullable();
            $table->text('description')->nullable();
            $table->string('color')->nullable();
            $table->string('map_url', 2048)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('announcement_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->boolean('is_important')->default(false);
            $table->date('valid_until')->nullable();
            $table->string('file_path', 2048)->nullable();
            $table->string('original_file_name')->nullable();
            $table->string('file_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('news_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('geoprocessing_analyses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('proyek_detail_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('center_latitude', 10, 8);
            $table->decimal('center_longitude', 11, 8);
            $table->decimal('radius_meters', 12, 2);
            $table->string('color')->default('#2563eb');
            $table->string('result_source', 50);
            $table->json('geojson');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $now = now();
        foreach ([
            ['name' => 'Musrenbang', 'color' => 'blue'],
            ['name' => 'Rapat Koordinasi', 'color' => 'emerald'],
            ['name' => 'Peninjauan Lapangan', 'color' => 'amber'],
            ['name' => 'Bimtek & Pelatihan', 'color' => 'purple'],
            ['name' => 'Evaluasi', 'color' => 'rose'],
        ] as $category) {
            DB::table('agenda_categories')->insert([
                ...$category,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach ([
            'Pengumuman Resmi',
            'Surat Edaran',
            'Informasi Tender / Lelang',
            'Rekrutmen / Seleksi',
            'Himbauan Publik',
        ] as $type) {
            DB::table('announcement_types')->insert([
                'name' => $type,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $newsCategories = DB::table('news')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->merge([
                'Pembangunan',
                'Infrastruktur',
                'Ekonomi & Keuangan',
                'Sosial Budaya',
                'SPBE & Digital',
                'Inovasi Daerah',
            ])
            ->unique();

        foreach ($newsCategories as $category) {
            DB::table('news_categories')->insertOrIgnore([
                'name' => $category,
                'slug' => Str::slug($category),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('geoprocessing_analyses');
        Schema::dropIfExists('news_categories');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('announcement_types');
        Schema::dropIfExists('agendas');
        Schema::dropIfExists('agenda_categories');
    }
};
