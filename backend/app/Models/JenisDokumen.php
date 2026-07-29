<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JenisDokumen extends Model
{
    use HasFactory;

    protected $table = 'jenis_dokuments';

    protected $fillable = [
        'name',
        'code',
        'scope_role',
        'is_default',
        'created_by',
    ];

    public function documents()
    {
        return $this->hasMany(Document::class, 'jenis_dokumen_id');
    }
}
