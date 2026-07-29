<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('views')->default(0)->after('downloads');
        });

        Schema::create('document_download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->string('email', 254)->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('downloaded_at')->useCurrent()->index();
            $table->timestamps();

            $table->index(['document_id', 'downloaded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_download_logs');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('views');
        });
    }
};
