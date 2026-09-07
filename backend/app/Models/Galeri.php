<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Galeri extends Model
{
    protected $table = 'galeri';

    protected $hidden = [
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $fillable = [
        'title',
        'category',
        'event_date',
        'description',
        'cover_image',
        'media',
        'is_published',
        'published_at',
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'media' => 'array',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];
}
