<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentDownloadLog extends Model
{
    protected $fillable = [
        'document_id',
        'document_version_id',
        'access_grant_id',
        'email',
        'email_hash',
        'ip_address',
        'user_agent',
        'downloaded_at',
    ];

    protected function casts(): array
    {
        return [
            'email' => 'encrypted',
            'downloaded_at' => 'datetime',
        ];
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function version()
    {
        return $this->belongsTo(DocumentVersion::class, 'document_version_id');
    }

    public function accessGrant()
    {
        return $this->belongsTo(DocumentAccessGrant::class, 'access_grant_id');
    }
}
