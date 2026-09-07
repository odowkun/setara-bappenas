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
        ];
    }
}
