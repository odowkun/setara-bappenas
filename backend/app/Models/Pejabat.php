<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pejabat extends Model
{
    use HasFactory;

    protected $fillable = [
        'node_id',
        'parent_id',
        'name',
        'position',
        'nip',
        'avatar',
        'order_index',
        'pos_x',
        'pos_y',
    ];
}
