<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeoprocessingAnalysis extends Model
{
    protected $fillable = [
        'name',
        'category',
        'proyek_detail_id',
        'center_latitude',
        'center_longitude',
        'radius_meters',
        'color',
        'notes',
        'result_source',
        'geojson',
        'source_kmz_path',
        'layer_geojson',
        'created_by_user_id',
    ];

    protected $casts = [
        'center_latitude' => 'float',
        'center_longitude' => 'float',
        'radius_meters' => 'float',
        'geojson' => 'array',
        'layer_geojson' => 'array',
    ];
}
