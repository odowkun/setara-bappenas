<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table): void {
            $table->timestamp('published_at')->nullable()->after('is_published')->index();
            $table->foreignId('created_by_user_id')->nullable()->after('published_at')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('published_by_user_id')->nullable()->after('created_by_user_id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('agendas', function (Blueprint $table): void {
            $table->timestamp('published_at')->nullable()->after('is_published')->index();
            $table->foreignId('published_by_user_id')->nullable()->after('created_by_user_id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('announcements', function (Blueprint $table): void {
            $table->foreignId('published_by_user_id')->nullable()->after('created_by_user_id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('galeri', function (Blueprint $table): void {
            $table->boolean('is_published')->default(false)->after('media')->index();
            $table->timestamp('published_at')->nullable()->after('is_published')->index();
            $table->foreignId('created_by_user_id')->nullable()->after('published_at')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('published_by_user_id')->nullable()->after('created_by_user_id')
                ->constrained('users')->nullOnDelete();
        });

        $now = now();
        DB::table('news')->where('is_published', true)->update([
            'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
        ]);
        DB::table('agendas')->where('is_published', true)->update([
            'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
        ]);
        DB::table('announcements')
            ->where('is_published', true)
            ->whereNull('published_at')
            ->update([
                'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
            ]);

        // Existing gallery rows predate draft support. Preserve them as already-published
        // database records; every new row defaults to draft.
        DB::table('galeri')->update([
            'is_published' => true,
            'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::table('galeri', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_by_user_id');
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropIndex(['published_at']);
            $table->dropIndex(['is_published']);
            $table->dropColumn(['published_at', 'is_published']);
        });

        Schema::table('announcements', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_by_user_id');
        });

        Schema::table('agendas', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_by_user_id');
            $table->dropIndex(['published_at']);
            $table->dropColumn('published_at');
        });

        Schema::table('news', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_by_user_id');
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropIndex(['published_at']);
            $table->dropColumn('published_at');
        });
    }
};
