<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpatialLayer extends Model
{
    use HasFactory;

    protected $table = 'spatial_layers';

    protected $fillable = [
        'name',
        'type',
        'legal_basis',
        'feature_count',
        'color',
        'visible',
        'file_name',
        'file_path',
        'geojson',
        'created_by',
    ];

    protected $casts = [
        'feature_count' => 'integer',
        'visible' => 'boolean',
    ];
}
