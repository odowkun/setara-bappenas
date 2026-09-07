<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Encrypt personal data at application level. The email hash is
     * one-way and is only used for exact filtering and aggregate counts.
     */
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table): void {
            $table->text('nama_responden')->nullable()->change();
            $table->text('email')->nullable()->change();
            $table->text('pekerjaan')->nullable()->change();
        });

        Schema::table('kritiks', function (Blueprint $table): void {
            $table->text('nama')->nullable()->change();
            $table->text('email')->nullable()->change();
            $table->text('telepon')->nullable()->change();
            $table->text('subjek')->change();
        });

        Schema::table('document_download_logs', function (Blueprint $table): void {
            $table->text('email')->change();
            $table->string('email_hash', 64)->nullable()->index()->after('email');
        });

        DB::table('surveys')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('surveys')->where('id', $row->id)->update([
                    'nama_responden' => $this->encryptNullable($row->nama_responden),
                    'email' => $this->encryptNullable($row->email),
                    'pekerjaan' => $this->encryptNullable($row->pekerjaan),
                    'saran_masukan' => $this->encryptNullable($row->saran_masukan),
                ]);
            }
        });

        DB::table('kritiks')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('kritiks')->where('id', $row->id)->update([
                    'nama' => $this->encryptNullable($row->nama),
                    'email' => $this->encryptNullable($row->email),
                    'telepon' => $this->encryptNullable($row->telepon),
                    'subjek' => $this->encryptNullable($row->subjek),
                    'pesan' => $this->encryptNullable($row->pesan),
                    'catatan_balasan' => $this->encryptNullable($row->catatan_balasan),
                ]);
            }
        });

        DB::table('document_download_logs')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                $normalizedEmail = mb_strtolower(trim((string) $row->email));

                DB::table('document_download_logs')->where('id', $row->id)->update([
                    'email' => Crypt::encryptString($normalizedEmail),
                    'email_hash' => hash('sha256', $normalizedEmail),
                    'ip_address' => null,
                    'user_agent' => null,
                ]);
            }
        });
    }

    public function down(): void
    {
        DB::table('surveys')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('surveys')->where('id', $row->id)->update([
                    'nama_responden' => $this->decryptNullable($row->nama_responden),
                    'email' => $this->decryptNullable($row->email),
                    'pekerjaan' => $this->decryptNullable($row->pekerjaan),
                    'saran_masukan' => $this->decryptNullable($row->saran_masukan),
                ]);
            }
        });

        DB::table('kritiks')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('kritiks')->where('id', $row->id)->update([
                    'nama' => $this->decryptNullable($row->nama),
                    'email' => $this->decryptNullable($row->email),
                    'telepon' => $this->decryptNullable($row->telepon),
                    'subjek' => $this->decryptNullable($row->subjek),
                    'pesan' => $this->decryptNullable($row->pesan),
                    'catatan_balasan' => $this->decryptNullable($row->catatan_balasan),
                ]);
            }
        });

        DB::table('document_download_logs')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('document_download_logs')->where('id', $row->id)->update([
                    'email' => Crypt::decryptString($row->email),
                ]);
            }
        });

        Schema::table('document_download_logs', function (Blueprint $table): void {
            $table->dropIndex(['email_hash']);
            $table->dropColumn('email_hash');
            $table->string('email', 254)->change();
        });

        Schema::table('surveys', function (Blueprint $table): void {
            $table->string('nama_responden')->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->string('pekerjaan')->nullable()->change();
        });

        Schema::table('kritiks', function (Blueprint $table): void {
            $table->string('nama')->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->string('telepon')->nullable()->change();
            $table->string('subjek')->change();
        });
    }

    private function encryptNullable(?string $value): ?string
    {
        return $value === null ? null : Crypt::encryptString($value);
    }

    private function decryptNullable(?string $value): ?string
    {
        return $value === null ? null : Crypt::decryptString($value);
    }
};
