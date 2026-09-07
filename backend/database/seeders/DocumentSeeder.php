<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * Arsip resmi tidak boleh dibuat dari URL eksternal, angka statistik
         * buatan, atau berkas contoh. Dokumen masuk hanya melalui alur unggah
         * privat -> checksum -> review -> publikasi pada API.
         */
    }
}
