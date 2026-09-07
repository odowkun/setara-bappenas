<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgendaCategory extends Model
{
    protected $fillable = ['name', 'color', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function agendas()
    {
        return $this->hasMany(Agenda::class);
    }
}
