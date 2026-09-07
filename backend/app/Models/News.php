<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    protected $table = 'news';

    protected $fillable = [
        'title',
        'slug',
        'category',
        'author',
        'date',
        'views',
        'content',
        'summary',
        'image',
        'is_published',
        'published_at',
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $hidden = [
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'views' => 'integer',
        'date' => 'date:Y-m-d',
    ];
}
