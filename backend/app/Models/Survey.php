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

    protected $appends = [
        'mutu_pelayanan',
        'kategori',
    ];

    public function getMutuPelayananAttribute(): string
    {
        $score = (float) $this->ikm_score;
        if ($score >= 88.31) {
            return 'A';
        }
        if ($score >= 76.61) {
            return 'B';
        }
        if ($score >= 65.00) {
            return 'C';
        }
        return 'D';
    }

    public function getKategoriAttribute(): string
    {
        $score = (float) $this->ikm_score;
        if ($score >= 88.31) {
            return 'Sangat Baik';
        }
        if ($score >= 76.61) {
            return 'Baik';
        }
        if ($score >= 65.00) {
            return 'Kurang Baik';
        }
        return 'Tidak Baik';
    }
}
