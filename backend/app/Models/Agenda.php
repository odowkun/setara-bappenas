<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Agenda extends Model
{
    protected $hidden = ['created_by_user_id', 'published_by_user_id'];

    protected $fillable = [
        'agenda_category_id',
        'title',
        'start_at',
        'end_at',
        'location',
        'organizer',
        'description',
        'color',
        'map_url',
        'latitude',
        'longitude',
        'is_published',
        'published_at',
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(AgendaCategory::class, 'agenda_category_id');
    }
}
