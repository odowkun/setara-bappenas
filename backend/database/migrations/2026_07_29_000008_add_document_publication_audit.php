<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->timestamp('published_at')->nullable()->after('is_public')->index();
            $table->foreignId('created_by_user_id')->nullable()->after('uploaded_by')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('published_by_user_id')->nullable()->after('created_by_user_id')
                ->constrained('users')->nullOnDelete();
        });

        DB::table('documents')->where('is_public', true)->update([
            'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_by_user_id');
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropIndex(['published_at']);
            $table->dropColumn('published_at');
        });
    }
};
