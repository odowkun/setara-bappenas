<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DocumentAccessGrant extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'document_id',
        'document_version_id',
        'purpose',
        'token_hash',
        'email',
        'email_hash',
        'expires_at',
        'consumed_at',
        'created_at',
    ];

    protected $hidden = [
        'token_hash',
        'email',
        'email_hash',
    ];

    protected $casts = [
        'email' => 'encrypted',
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'document_version_id');
    }

    public function downloadLog(): HasOne
    {
        return $this->hasOne(DocumentDownloadLog::class, 'access_grant_id');
    }
}
