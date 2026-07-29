<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'title',
        'jenis',
        'bidang',
        'tahun',
        'ukuran',
        'downloads',
        'views',
        'file_path',
        'is_public',
        'uploaded_by',
    ];

    public function proyekDetails()
    {
        return $this->hasMany(ProyekDetail::class, 'document_id');
    }

    public function downloadLogs()
    {
        return $this->hasMany(DocumentDownloadLog::class);
    }
}
