<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kritik extends Model
{
    protected $table = 'kritiks';

    protected $fillable = [
        'nama',
        'email',
        'telepon',
        'skpd_tujuan',
        'subjek',
        'pesan',
        'status',
        'catatan_balasan',
        'dijawab_oleh',
        'tgl_dijawab',
        'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'nama' => 'encrypted',
            'email' => 'encrypted',
            'telepon' => 'encrypted',
            'subjek' => 'encrypted',
            'pesan' => 'encrypted',
            'catatan_balasan' => 'encrypted',
            'tgl_dijawab' => 'datetime',
            'is_hidden' => 'boolean',
        ];
    }
}
