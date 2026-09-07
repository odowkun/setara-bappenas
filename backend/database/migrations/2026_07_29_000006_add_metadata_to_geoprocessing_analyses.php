<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geoprocessing_analyses', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('name');
            $table->text('notes')->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('geoprocessing_analyses', function (Blueprint $table) {
            $table->dropColumn(['category', 'notes']);
        });
    }
};
