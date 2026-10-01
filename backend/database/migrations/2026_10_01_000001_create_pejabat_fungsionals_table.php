<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create dedicated table for Kelompok Jabatan Fungsional
        if (!Schema::hasTable('pejabat_fungsionals')) {
            Schema::create('pejabat_fungsionals', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('nip')->nullable();
                $table->string('position'); // Nama Jabatan Fungsional (contoh: Perencana Ahli Pertama)
                $table->string('avatar')->nullable();
                $table->integer('order_index')->default(0);
                $table->timestamps();
            });
        }

        // 2. Clean up any legacy fungsional records from pejabats structural tree
        if (Schema::hasTable('pejabats')) {
            DB::table('pejabats')
                ->whereRaw('LOWER(position) LIKE ?', ['%fungsional%'])
                ->delete();
        }

        // 3. Seed initial representative functional personnel if empty
        if (DB::table('pejabat_fungsionals')->count() === 0) {
            DB::table('pejabat_fungsionals')->insert([
                [
                    'name' => 'Agustino Hermanus, S.T.',
                    'nip' => '198705122010011008',
                    'position' => 'Perencana Ahli Muda',
                    'avatar' => null,
                    'order_index' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Debby C. Pinoa, S.E.',
                    'nip' => '199008142015032001',
                    'position' => 'Analis Kebijakan Ahli Muda',
                    'avatar' => null,
                    'order_index' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Frangky Mahura, S.Kom',
                    'nip' => '199203202019021004',
                    'position' => 'Pranata Komputer Ahli Pertama',
                    'avatar' => null,
                    'order_index' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Meilan S. Toho, S.Si',
                    'nip' => '199411082020012002',
                    'position' => 'Perencana Ahli Pertama',
                    'avatar' => null,
                    'order_index' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pejabat_fungsionals');
    }
};
