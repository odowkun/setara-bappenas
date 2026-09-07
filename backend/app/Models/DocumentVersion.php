<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentVersion extends Model
{
    protected $fillable = [
        'document_id',
        'version_number',
        'version_label',
        'file_name',
        'file_path',
        'storage_disk',
        'mime_type',
        'file_size_bytes',
        'checksum_sha256',
        'integrity_status',
        'integrity_verified_at',
        'extraction_status',
        'extraction_method',
        'full_text',
        'extraction_error',
        'page_count',
        'extracted_at',
        'change_summary',
        'status',
        'submitted_at',
        'submitted_by_user_id',
        'approved_at',
        'approved_by_user_id',
        'review_note',
        'created_by_user_id',
    ];

    protected $hidden = [
        'file_path',
        'full_text',
        'submitted_by_user_id',
        'approved_by_user_id',
        'created_by_user_id',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'file_size_bytes' => 'integer',
        'page_count' => 'integer',
        'integrity_verified_at' => 'datetime',
        'extracted_at' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function scopeApproved(Builder $query): Builder
    {
        return $query
            ->where('status', 'approved')
            ->where('integrity_status', 'valid');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(DocumentApprovalLog::class);
    }

    public function viewLogs(): HasMany
    {
        return $this->hasMany(DocumentViewLog::class);
    }

    public function accessGrants(): HasMany
    {
        return $this->hasMany(DocumentAccessGrant::class);
    }

    public function downloadLogs(): HasMany
    {
        return $this->hasMany(DocumentDownloadLog::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
