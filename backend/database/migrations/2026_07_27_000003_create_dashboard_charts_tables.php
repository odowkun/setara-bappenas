<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('realisasi_apbd_monthly', function (Blueprint $table) {
            $table->id();
            $table->string('month');
            $table->integer('month_order')->default(0);
            $table->decimal('keuangan', 5, 2)->default(0);
            $table->decimal('fisik', 5, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('program_sektoral', function (Blueprint $table) {
            $table->id();
            $table->string('sector');
            $table->decimal('realisasi', 5, 2)->default(0);
            $table->decimal('target', 5, 2)->default(0);
            $table->string('color')->default('bg-blue-600');
            $table->string('text_color')->default('text-blue-700');
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_apbd_monthly');
        Schema::dropIfExists('program_sektoral');
    }
};
