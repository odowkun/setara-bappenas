<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RunningText extends Model
{
    protected $fillable = [
        'content',
        'tag',
        'url',
        'is_active',
        'order_index',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];
}
