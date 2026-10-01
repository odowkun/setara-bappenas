<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PejabatFungsional extends Model
{
    use HasFactory;

    protected $table = 'pejabat_fungsionals';

    protected $fillable = [
        'name',
        'nip',
        'position',
        'avatar',
        'order_index',
    ];
}
