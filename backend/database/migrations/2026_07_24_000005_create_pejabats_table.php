<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pejabats', function (Blueprint $table) {
            $table->id();
            $table->string('node_id')->unique();
            $table->string('parent_id')->nullable();
            $table->string('name');
            $table->string('position');
            $table->string('nip')->nullable();
            $table->string('avatar')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pejabats');
    }
};
