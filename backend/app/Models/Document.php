<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'archive_code',
        'document_number',
        'title',
        'summary',
        'jenis',
        'jenis_dokumen_id',
        'bidang',
        'tahun',
        'tanggal_mulai',
        'tanggal_selesai',
        'ukuran',
        'downloads',
        'views',
        'unique_views',
        'file_path',
        'is_public',
        'published_at',
        'uploaded_by',
        'owner_opd',
        'classification',
        'governance_status',
        'storage_status',
        'keywords',
        'effective_at',
        'expires_at',
        'retention_policy',
        'retention_until',
        'retention_status',
        'legal_hold',
        'review_note',
        'current_version_id',
        'submitted_at',
        'submitted_by_user_id',
        'approved_at',
        'approved_by_user_id',
        'archived_at',
        'archived_by_user_id',
        'archive_note',
        'created_by_user_id',
        'published_by_user_id',
    ];

    protected $hidden = [
        'created_by_user_id',
        'published_by_user_id',
        'submitted_by_user_id',
        'approved_by_user_id',
        'archived_by_user_id',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'legal_hold' => 'boolean',
        'published_at' => 'datetime',
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'effective_at' => 'date',
        'expires_at' => 'date',
        'retention_until' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'archived_at' => 'datetime',
        'keywords' => 'array',
        'downloads' => 'integer',
        'views' => 'integer',
        'unique_views' => 'integer',
    ];

    public function scopePubliclyAvailable(Builder $query): Builder
    {
        return $query
            ->where('is_public', true)
            ->where(function ($q) {
                $q->where('classification', 'public')
                  ->orWhereNull('classification');
            })
            ->where(function ($q) {
                $q->where('governance_status', 'approved')
                  ->orWhereNull('governance_status');
            });
    }


    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'current_version_id');
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(DocumentVersion::class)
            ->ofMany('version_number', 'max');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class)
            ->orderByDesc('version_number');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(DocumentApprovalLog::class)
            ->latest('created_at');
    }

    public function viewLogs(): HasMany
    {
        return $this->hasMany(DocumentViewLog::class);
    }

    public function accessGrants(): HasMany
    {
        return $this->hasMany(DocumentAccessGrant::class);
    }

    public function proyekDetails(): HasMany
    {
        return $this->hasMany(ProyekDetail::class, 'document_id');
    }

    public function downloadLogs(): HasMany
    {
        return $this->hasMany(DocumentDownloadLog::class);
    }

    public function jenisDokumen(): BelongsTo
    {
        return $this->belongsTo(JenisDokumen::class, 'jenis_dokumen_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_user_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by_user_id');
    }
}
