<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentViewLog extends Model
{
    protected $fillable = [
        'document_id',
        'document_version_id',
        'access_grant_id',
        'visitor_hash',
        'viewed_on',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_on' => 'date',
        'viewed_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'document_version_id');
    }

    public function accessGrant(): BelongsTo
    {
        return $this->belongsTo(DocumentAccessGrant::class);
    }
}
