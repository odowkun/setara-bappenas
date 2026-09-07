<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $hidden = ['created_by_user_id', 'published_by_user_id'];

    protected $fillable = [
        'announcement_type_id',
        'title',
        'content',
        'is_important',
        'valid_until',
        'file_path',
        'original_file_name',
        'file_type',
        'file_size',
        'is_published',
        'published_at',
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $casts = [
        'is_important' => 'boolean',
        'is_published' => 'boolean',
        'valid_until' => 'date:Y-m-d',
        'published_at' => 'datetime',
        'file_size' => 'integer',
    ];

    public function type()
    {
        return $this->belongsTo(AnnouncementType::class, 'announcement_type_id');
    }
}
