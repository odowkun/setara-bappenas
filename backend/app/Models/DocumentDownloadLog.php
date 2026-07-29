<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentDownloadLog extends Model
{
    protected $fillable = [
        'document_id',
        'email',
        'ip_address',
        'user_agent',
        'downloaded_at',
    ];

    protected function casts(): array
    {
        return [
            'downloaded_at' => 'datetime',
        ];
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
