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
        'esri_sync_status',
        'esri_synced_at',
        'esri_last_error',
        'pagu_anggaran',
        'realisasi_anggaran',
        'persentase_progres',
        'status_progres',
        'delineasi_geojson',
        'tipe_geometri',
        'luas_area_ha',
        'panjang_km',
        'opd_penanggung_jawab',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'delineasi_geojson' => 'array',
        'luas_area_ha' => 'float',
        'panjang_km' => 'float',
        'latitude' => 'float',
        'longitude' => 'float',
        'pagu_anggaran' => 'float',
        'realisasi_anggaran' => 'float',
        'persentase_progres' => 'float',
        'esri_synced_at' => 'datetime',
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
