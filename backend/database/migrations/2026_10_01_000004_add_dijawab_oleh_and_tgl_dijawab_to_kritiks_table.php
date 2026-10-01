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
        Schema::table('kritiks', function (Blueprint $table) {
            $table->string('dijawab_oleh')->nullable()->after('catatan_balasan');
            $table->timestamp('tgl_dijawab')->nullable()->after('dijawab_oleh');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kritiks', function (Blueprint $table) {
            $table->dropColumn(['dijawab_oleh', 'tgl_dijawab']);
        });
    }
};
