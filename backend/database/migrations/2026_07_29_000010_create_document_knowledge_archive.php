<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * @var array<int, string>
     */
    private array $permissions = [
        'review_documents',
        'publish_documents',
        'classify_documents',
        'manage_document_retention',
        'verify_document_integrity',
    ];

    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->string('archive_code', 80)->nullable()->unique()->after('id');
            $table->string('document_number', 150)->nullable()->index()->after('archive_code');
            $table->string('owner_opd')->nullable()->index()->after('uploaded_by');
            $table->string('classification', 30)->default('internal')->index()->after('owner_opd');
            $table->string('governance_status', 30)->default('draft')->index()->after('classification');
            $table->string('storage_status', 30)->default('private')->index()->after('governance_status');
            $table->json('keywords')->nullable()->after('storage_status');
            $table->date('effective_at')->nullable()->after('keywords');
            $table->date('expires_at')->nullable()->index()->after('effective_at');
            $table->string('retention_policy', 40)->default('permanent')->after('expires_at');
            $table->date('retention_until')->nullable()->index()->after('retention_policy');
            $table->string('retention_status', 30)->default('active')->index()->after('retention_until');
            $table->boolean('legal_hold')->default(false)->index()->after('retention_status');
            $table->text('review_note')->nullable()->after('legal_hold');
            $table->unsignedBigInteger('current_version_id')->nullable()->index()->after('review_note');
            $table->timestamp('submitted_at')->nullable()->after('current_version_id');
            $table->foreignId('submitted_by_user_id')->nullable()->after('submitted_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('submitted_by_user_id');
            $table->foreignId('approved_by_user_id')->nullable()->after('approved_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('archived_at')->nullable()->index()->after('approved_by_user_id');
            $table->foreignId('archived_by_user_id')->nullable()->after('archived_at')
                ->constrained('users')->nullOnDelete();
            $table->text('archive_note')->nullable()->after('archived_by_user_id');
            $table->unsignedBigInteger('unique_views')->default(0)->after('views');
        });

        Schema::create('document_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('version_label', 40);
            $table->string('file_name')->nullable();
            $table->string('file_path', 2048);
            $table->string('storage_disk', 40)->default('local');
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->char('checksum_sha256', 64)->nullable()->index();
            $table->string('integrity_status', 20)->default('pending')->index();
            $table->timestamp('integrity_verified_at')->nullable();
            $table->string('extraction_status', 30)->default('pending')->index();
            $table->string('extraction_method', 40)->nullable();
            $table->longText('full_text')->nullable();
            $table->text('extraction_error')->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->timestamp('extracted_at')->nullable();
            $table->text('change_summary')->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['document_id', 'version_number']);
            $table->index(['document_id', 'status']);
        });

        Schema::create('document_approval_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('document_version_id')->nullable()
                ->constrained('document_versions')->nullOnDelete();
            $table->foreignId('actor_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('action', 40)->index();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
        });

        Schema::create('document_access_grants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('document_version_id')
                ->constrained('document_versions')->cascadeOnDelete();
            $table->string('purpose', 20)->index();
            $table->char('token_hash', 64)->unique();
            $table->text('email')->nullable();
            $table->char('email_hash', 64)->nullable()->index();
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable()->index();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['document_id', 'purpose', 'expires_at']);
        });

        Schema::create('document_view_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('document_version_id')->nullable()
                ->constrained('document_versions')->nullOnDelete();
            $table->foreignId('access_grant_id')->nullable()
                ->constrained('document_access_grants')->nullOnDelete();
            $table->char('visitor_hash', 64);
            $table->date('viewed_on');
            $table->timestamp('viewed_at')->useCurrent()->index();
            $table->timestamps();

            $table->unique(['document_id', 'visitor_hash', 'viewed_on']);
            $table->index(['document_version_id', 'viewed_at']);
        });

        Schema::table('document_download_logs', function (Blueprint $table): void {
            $table->foreignId('document_version_id')->nullable()->after('document_id')
                ->constrained('document_versions')->nullOnDelete();
            $table->foreignId('access_grant_id')->nullable()->unique()->after('document_version_id')
                ->constrained('document_access_grants')->nullOnDelete();
        });

        $this->backfillExistingDocuments();

        Schema::table('documents', function (Blueprint $table): void {
            $table->foreign('current_version_id')
                ->references('id')
                ->on('document_versions')
                ->nullOnDelete();
        });

        $this->configurePermissions();
    }

    public function down(): void
    {
        $this->removePermissions();

        Schema::table('document_download_logs', function (Blueprint $table): void {
            $table->dropUnique(['access_grant_id']);
            $table->dropConstrainedForeignId('access_grant_id');
            $table->dropConstrainedForeignId('document_version_id');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropForeign(['current_version_id']);
        });

        Schema::dropIfExists('document_view_logs');
        Schema::dropIfExists('document_access_grants');
        Schema::dropIfExists('document_approval_logs');
        Schema::dropIfExists('document_versions');

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropUnique(['archive_code']);
            $table->dropIndex(['document_number']);
            $table->dropIndex(['owner_opd']);
            $table->dropIndex(['classification']);
            $table->dropIndex(['governance_status']);
            $table->dropIndex(['storage_status']);
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['retention_until']);
            $table->dropIndex(['retention_status']);
            $table->dropIndex(['legal_hold']);
            $table->dropIndex(['current_version_id']);
            $table->dropIndex(['archived_at']);
            $table->dropConstrainedForeignId('archived_by_user_id');
            $table->dropConstrainedForeignId('approved_by_user_id');
            $table->dropConstrainedForeignId('submitted_by_user_id');
            $table->dropColumn([
                'archive_code',
                'document_number',
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
                'approved_at',
                'archived_at',
                'archive_note',
                'unique_views',
            ]);
        });
    }

    private function backfillExistingDocuments(): void
    {
        DB::table('documents')
            ->select([
                'id',
                'title',
                'file_path',
                'ukuran',
                'is_public',
                'published_at',
                'published_by_user_id',
                'created_by_user_id',
                'created_at',
            ])
            ->orderBy('id')
            ->chunkById(100, function ($documents): void {
                foreach ($documents as $document) {
                    $archiveCode = sprintf('BPH-DOC-%08d', $document->id);
                    $relativePath = $this->privateRelativePath((string) $document->file_path);
                    $isPrivate = $relativePath !== null
                        && Storage::disk('local')->exists($relativePath);
                    $isExternal = filter_var($document->file_path, FILTER_VALIDATE_URL) !== false
                        && $relativePath === null;

                    if (! $isPrivate) {
                        $this->backfillUnavailableDocument(
                            $document,
                            $archiveCode,
                            $isExternal ? 'legacy_external' : 'missing'
                        );

                        continue;
                    }

                    $absolutePath = Storage::disk('local')->path($relativePath);
                    $approved = (bool) $document->is_public;
                    $versionId = DB::table('document_versions')->insertGetId([
                        'document_id' => $document->id,
                        'version_number' => 1,
                        'version_label' => 'v1.0',
                        'file_name' => basename($relativePath),
                        'file_path' => $relativePath,
                        'storage_disk' => 'local',
                        'mime_type' => Storage::disk('local')->mimeType($relativePath)
                            ?: 'application/pdf',
                        'file_size_bytes' => Storage::disk('local')->size($relativePath),
                        'checksum_sha256' => hash_file('sha256', $absolutePath),
                        'integrity_status' => 'valid',
                        'integrity_verified_at' => now(),
                        'extraction_status' => 'pending',
                        'change_summary' => 'Migrasi versi awal dari arsip dokumen',
                        'status' => $approved ? 'approved' : 'draft',
                        'approved_at' => $approved
                            ? ($document->published_at ?? $document->created_at ?? now())
                            : null,
                        'approved_by_user_id' => $approved
                            ? $document->published_by_user_id
                            : null,
                        'created_by_user_id' => $document->created_by_user_id,
                        'created_at' => $document->created_at ?? now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('documents')->where('id', $document->id)->update([
                        'archive_code' => $archiveCode,
                        'owner_opd' => 'BAPPEDA Kabupaten Halmahera Utara',
                        'classification' => $approved ? 'public' : 'internal',
                        'governance_status' => $approved ? 'approved' : 'draft',
                        'storage_status' => 'private',
                        'retention_policy' => 'permanent',
                        'retention_status' => 'active',
                        'current_version_id' => $approved ? $versionId : null,
                        'approved_at' => $approved
                            ? ($document->published_at ?? $document->created_at ?? now())
                            : null,
                        'approved_by_user_id' => $approved
                            ? $document->published_by_user_id
                            : null,
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    private function backfillUnavailableDocument(
        object $document,
        string $archiveCode,
        string $storageStatus
    ): void {
        DB::table('document_versions')->insert([
            'document_id' => $document->id,
            'version_number' => 1,
            'version_label' => 'v1.0-legacy',
            'file_name' => basename(
                parse_url((string) $document->file_path, PHP_URL_PATH) ?: 'dokumen-lama.pdf'
            ),
            'file_path' => (string) $document->file_path,
            'storage_disk' => 'local',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => null,
            'checksum_sha256' => null,
            'integrity_status' => 'missing',
            'extraction_status' => 'unavailable',
            'extraction_error' => $storageStatus === 'legacy_external'
                ? 'Berkas lama masih berada di alamat eksternal dan harus dimigrasikan.'
                : 'Berkas lama tidak ditemukan pada storage privat.',
            'change_summary' => 'Placeholder migrasi arsip lama',
            'status' => 'draft',
            'created_by_user_id' => $document->created_by_user_id,
            'created_at' => $document->created_at ?? now(),
            'updated_at' => now(),
        ]);

        DB::table('documents')->where('id', $document->id)->update([
            'archive_code' => $archiveCode,
            'owner_opd' => 'BAPPEDA Kabupaten Halmahera Utara',
            'classification' => 'internal',
            'governance_status' => 'pending_migration',
            'storage_status' => $storageStatus,
            'retention_policy' => 'permanent',
            'retention_status' => 'active',
            'current_version_id' => null,
            'is_public' => false,
            'published_at' => null,
            'published_by_user_id' => null,
            'updated_at' => now(),
        ]);
    }

    private function privateRelativePath(string $filePath): ?string
    {
        $urlPath = parse_url($filePath, PHP_URL_PATH);
        if (! is_string($urlPath)) {
            return null;
        }

        $normalizedPath = ltrim($urlPath, '/');
        if (str_starts_with($normalizedPath, 'storage/')) {
            $normalizedPath = substr($normalizedPath, strlen('storage/'));
        }

        return str_starts_with($normalizedPath, 'documents/')
            && ! str_contains($normalizedPath, '..')
            && ! str_contains($normalizedPath, '\\')
            && preg_match('/\Adocuments\/[A-Za-z0-9._\/-]+\z/', $normalizedPath) === 1
            ? $normalizedPath
            : null;
    }

    private function configurePermissions(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $superadmin = Role::firstOrCreate([
            'name' => 'superadmin',
            'guard_name' => 'web',
        ]);
        $adminUmum = Role::firstOrCreate([
            'name' => 'admin_umum',
            'guard_name' => 'web',
        ]);
        Role::firstOrCreate([
            'name' => 'admin_bidang',
            'guard_name' => 'web',
        ]);

        $superadmin->givePermissionTo($this->permissions);
        $adminUmum->givePermissionTo($this->permissions);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function removePermissions(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::query()->each(function (Role $role): void {
            $remaining = $role->permissions
                ->reject(
                    fn (Permission $permission): bool => in_array(
                        $permission->name,
                        $this->permissions,
                        true
                    )
                )
                ->pluck('name')
                ->all();
            $role->syncPermissions($remaining);
        });

        Permission::query()->whereIn('name', $this->permissions)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
