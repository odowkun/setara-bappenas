<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProyekAttachment extends Model
{
    use HasFactory;

    protected $table = 'proyek_attachments';

    protected $fillable = [
        'proyek_detail_id',
        'file_name',
        'file_path',
        'file_type',
        'esri_attachment_id',
        'file_size',
        'uploaded_by',
    ];

    public function proyekDetail()
    {
        return $this->belongsTo(ProyekDetail::class, 'proyek_detail_id');
    }
}
