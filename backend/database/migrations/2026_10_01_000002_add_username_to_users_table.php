<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }
            $table->string('email')->nullable()->change();
        });

        // Populate usernames for existing users that have no username
        $users = DB::table('users')->whereNull('username')->orWhere('username', '')->get();
        foreach ($users as $user) {
            $baseUsername = null;
            if (!empty($user->email)) {
                $baseUsername = strtolower(explode('@', $user->email)[0]);
            }
            if (empty($baseUsername) && !empty($user->name)) {
                $baseUsername = strtolower(Str::slug($user->name, ''));
            }
            $baseUsername = preg_replace('/[^a-z0-9_.-]/', '', (string) ($baseUsername ?: 'user' . $user->id));
            if (strlen($baseUsername) < 3) {
                $baseUsername = 'user_' . $baseUsername;
            }

            $username = $baseUsername;
            $counter = 1;
            while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = "{$baseUsername}{$counter}";
                $counter++;
            }

            DB::table('users')->where('id', $user->id)->update([
                'username' => $username,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'username')) {
                $table->dropColumn('username');
            }
            $table->string('email')->nullable(false)->change();
        });
    }
};
