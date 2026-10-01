<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            if (! Schema::hasColumn('proyek_details', 'is_published')) {
                $table->boolean('is_published')->default(true)->index()->after('status_progres');
            }
            if (! Schema::hasColumn('proyek_details', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('is_published');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'published_at']);
        });
    }
};
