<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    protected $fillable = [
        'nama_responden',
        'email',
        'pekerjaan',
        'jenis_layanan',
        'u1_persyaratan',
        'u2_prosedur',
        'u3_kecepatan',
        'u4_produk',
        'u5_sikap',
        'ikm_score',
        'saran_masukan',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'nama_responden' => 'encrypted',
            'email' => 'encrypted',
            'pekerjaan' => 'encrypted',
            'saran_masukan' => 'encrypted',
            'ikm_score' => 'decimal:2',
        ];
    }
}
