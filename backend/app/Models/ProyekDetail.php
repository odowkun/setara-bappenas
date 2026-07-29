<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProyekDetail extends Model
{
    use HasFactory;

    protected $table = 'proyek_details';

    protected $fillable = [
        'document_id',
        'kode_proyek',
        'nama_proyek',
        'bidang',
        'kecamatan',
        'desa_kelurahan',
        'lokasi_deskripsi',
        'latitude',
        'longitude',
        'esri_objectid',
        'pagu_anggaran',
        'realisasi_anggaran',
        'persentase_progres',
        'status_progres',
        'opd_penanggung_jawab',
        'created_by',
        'updated_by',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function attachments()
    {
        return $this->hasMany(ProyekAttachment::class, 'proyek_detail_id');
    }
}
