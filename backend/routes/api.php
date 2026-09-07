<?php

use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContentTaxonomyController;
use App\Http\Controllers\Api\DashboardChartController;
use App\Http\Controllers\Api\DocumentAnalyticsController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentFileController;
use App\Http\Controllers\Api\DocumentGovernanceController;
use App\Http\Controllers\Api\GaleriController;
use App\Http\Controllers\Api\GeoSettingController;
use App\Http\Controllers\Api\JenisDokumenController;
use App\Http\Controllers\Api\KritikController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\PejabatController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\ProyekDetailController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\TautanOpdController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\AuditAdminMutation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

Route::prefix('v1')->group(function () {
    // Geo Settings Endpoints
    Route::get('/geo-settings', [GeoSettingController::class, 'show']);
    Route::put('/geo-settings', [GeoSettingController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_dashboard', AuditAdminMutation::class])
        ->name('geo-settings.update');

    // Dashboard Charts Endpoints
    Route::get('/dashboard/charts', [DashboardChartController::class, 'index']);
    Route::put('/dashboard/charts/realisasi-apbd/{id}', [DashboardChartController::class, 'updateMonthly'])
        ->middleware(['auth:sanctum', 'permission:manage_dashboard', AuditAdminMutation::class])
        ->name('dashboard.realisasi.update');
    Route::put('/dashboard/charts/program-sektoral/{id}', [DashboardChartController::class, 'updateProgram'])
        ->middleware(['auth:sanctum', 'permission:manage_dashboard', AuditAdminMutation::class])
        ->name('dashboard.program.update');

    // Galeri Endpoints
    Route::get('/galeri', [GaleriController::class, 'index']);
    Route::get('/admin/galeri', [GaleriController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri']);
    Route::get('/admin/galeri/{galeri}', [GaleriController::class, 'show'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri']);
    Route::post('/galeri', [GaleriController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri', AuditAdminMutation::class])
        ->name('galeri.store');
    Route::put('/galeri/{galeri}', [GaleriController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri', AuditAdminMutation::class])
        ->name('galeri.update');
    Route::patch('/galeri/{galeri}/publication', [GaleriController::class, 'updatePublication'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri', AuditAdminMutation::class])
        ->name('galeri.publication.update');
    Route::delete('/galeri/{galeri}', [GaleriController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_galeri', AuditAdminMutation::class])
        ->name('galeri.destroy');

    // Tautan OPD Endpoints
    Route::get('/tautan-opd', [TautanOpdController::class, 'index']);
    Route::post('/tautan-opd/upload-logo', [TautanOpdController::class, 'uploadLogo'])
        ->middleware(['auth:sanctum', 'permission:manage_tautan_opd', AuditAdminMutation::class])
        ->name('tautan-opd.logo.upload');
    Route::post('/tautan-opd', [TautanOpdController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_tautan_opd', AuditAdminMutation::class])
        ->name('tautan-opd.store');
    Route::put('/tautan-opd/{id}', [TautanOpdController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_tautan_opd', AuditAdminMutation::class])
        ->name('tautan-opd.update');
    Route::delete('/tautan-opd/{id}', [TautanOpdController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_tautan_opd', AuditAdminMutation::class])
        ->name('tautan-opd.destroy');

    // Audit Logs Endpoint
    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:view_audit_logs']);

    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get(
        '/documents/{document}/versions/{version}/preview-file',
        [DocumentFileController::class, 'preview']
    )
        ->middleware(['signed:relative', 'throttle:120,1'])
        ->name('documents.file.preview');
    Route::post('/documents/{id}/preview', [DocumentAnalyticsController::class, 'preview'])
        ->middleware('throttle:60,1');
    Route::post('/documents/{id}/download', [DocumentAnalyticsController::class, 'download'])
        ->middleware('throttle:20,1');
    Route::get(
        '/documents/{document}/versions/{version}/file',
        [DocumentFileController::class, 'download']
    )
        ->middleware(['signed:relative', 'throttle:30,1'])
        ->name('documents.file.download');
    Route::get('/admin/documents', [DocumentController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen']);
    Route::get('/admin/documents/{document}/governance', [DocumentGovernanceController::class, 'show'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen']);
    Route::put('/admin/documents/{document}/governance', [DocumentGovernanceController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:classify_documents|manage_document_retention', AuditAdminMutation::class])
        ->name('documents.governance.update');
    Route::get(
        '/admin/documents/{document}/versions/{version}/preview-file',
        [DocumentFileController::class, 'adminPreview']
    )
        ->middleware([
            'auth:sanctum',
            'permission:manage_dokumen',
            'signed:relative',
            'throttle:120,1',
        ])
        ->name('documents.file.admin-preview');
    Route::post('/documents', [DocumentController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.store');
    Route::post('/documents/{document}/versions', [DocumentGovernanceController::class, 'addVersion'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.versions.store');
    Route::patch('/documents/{document}/workflow/submit', [DocumentGovernanceController::class, 'submit'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.workflow.submit');
    Route::patch('/documents/{document}/workflow/review', [DocumentGovernanceController::class, 'review'])
        ->middleware(['auth:sanctum', 'permission:review_documents', AuditAdminMutation::class])
        ->name('documents.workflow.review');
    Route::post('/documents/{document}/integrity', [DocumentGovernanceController::class, 'verify'])
        ->middleware(['auth:sanctum', 'permission:verify_document_integrity', AuditAdminMutation::class])
        ->name('documents.integrity.verify');
    Route::post(
        '/documents/{document}/versions/{version}/extract',
        [DocumentGovernanceController::class, 'extract']
    )
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.versions.extract');
    Route::patch('/documents/{document}/publication', [DocumentController::class, 'updatePublication'])
        ->middleware(['auth:sanctum', 'permission:publish_documents', AuditAdminMutation::class])
        ->name('documents.publication.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.destroy');
    Route::post('/documents/upload-chunk', [DocumentController::class, 'uploadChunk'])
        ->middleware(['auth:sanctum', 'permission:manage_dokumen', AuditAdminMutation::class])
        ->name('documents.chunk.upload');
    Route::post('/media/upload-optimized', [MediaController::class, 'uploadMedia'])
        ->middleware(['auth:sanctum', 'permission:manage_berita|manage_galeri|manage_profil', AuditAdminMutation::class])
        ->name('media.optimized.upload');

    // Dynamic Jenis Dokumen Management Endpoints
    Route::get('/jenis-dokumen', [JenisDokumenController::class, 'index']);
    Route::post('/jenis-dokumen', [JenisDokumenController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_document_types', AuditAdminMutation::class])
        ->name('document-types.store');
    Route::delete('/jenis-dokumen/{id}', [JenisDokumenController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_document_types', AuditAdminMutation::class])
        ->name('document-types.destroy');

    // Survey Kepuasan & Kritik Saran Routes
    Route::get('/surveys/summary', [SurveyController::class, 'publicSummary']);
    Route::get('/surveys', [SurveyController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:manage_survey']);
    Route::get('/surveys/config', [SurveyController::class, 'getConfig']);
    Route::post('/surveys/questions', [SurveyController::class, 'storeQuestion'])
        ->middleware(['auth:sanctum', 'permission:manage_survey', AuditAdminMutation::class])
        ->name('surveys.questions.store');
    Route::post('/surveys/questions/reorder', [SurveyController::class, 'reorderQuestions'])
        ->middleware(['auth:sanctum', 'permission:manage_survey', AuditAdminMutation::class])
        ->name('surveys.questions.reorder');
    Route::put('/surveys/questions/{id}', [SurveyController::class, 'updateQuestion'])
        ->middleware(['auth:sanctum', 'permission:manage_survey', AuditAdminMutation::class])
        ->name('surveys.questions.update');
    Route::delete('/surveys/questions/{id}', [SurveyController::class, 'deleteQuestion'])
        ->middleware(['auth:sanctum', 'permission:manage_survey', AuditAdminMutation::class])
        ->name('surveys.questions.destroy');
    Route::post('/surveys/services', [SurveyController::class, 'storeService'])
        ->middleware(['auth:sanctum', 'permission:manage_survey|manage_kritik', AuditAdminMutation::class])
        ->name('surveys.services.store');
    Route::delete('/surveys/services/{id}', [SurveyController::class, 'deleteService'])
        ->middleware(['auth:sanctum', 'permission:manage_survey|manage_kritik', AuditAdminMutation::class])
        ->name('surveys.services.destroy');
    Route::post('/surveys', [SurveyController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::get('/kritik', [KritikController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:manage_kritik']);
    Route::post('/kritik', [KritikController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::put('/kritik/{id}/tanggapan', [KritikController::class, 'updateTanggapan'])
        ->middleware(['auth:sanctum', 'permission:manage_kritik', AuditAdminMutation::class])
        ->name('kritik.response.update');

    // Fitur 2 - 5: Geotagging Proyek, Tabular Update, Attachments & Geoprocessing
    Route::get('/proyek-details', [ProyekDetailController::class, 'index']);
    Route::get('/proyek-details/{id}', [ProyekDetailController::class, 'show']);
    Route::get('/admin/proyek-details', [ProyekDetailController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_gis']);
    Route::post('/documents/{documentId}/proyek', [ProyekDetailController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.store');
    Route::put('/proyek-details/{id}/progres', [ProyekDetailController::class, 'updateProgres'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.progress.update');
    Route::post('/proyek-details/{id}/attachment', [ProyekDetailController::class, 'uploadAttachment'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.attachments.store');
    Route::delete('/proyek-details/{id}', [ProyekDetailController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.destroy');
    Route::post('/admin/proyek-details/{id}/resync-esri', [ProyekDetailController::class, 'resyncEsri'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.resync-esri');
    Route::delete('/proyek-attachments/{attachmentId}', [ProyekDetailController::class, 'deleteAttachment'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('projects.attachments.destroy');
    Route::post('/gis/geoprocessing/buffer', [ProyekDetailController::class, 'geoprocessingBuffer'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('gis.buffer.run');
    Route::get('/gis/geoprocessing/analyses', [ProyekDetailController::class, 'geoprocessingIndex']);
    Route::delete('/gis/geoprocessing/analyses/{analysis}', [ProyekDetailController::class, 'destroyGeoprocessing'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('gis.analysis.destroy');
    Route::put('/gis/geoprocessing/analyses/{analysis}', [ProyekDetailController::class, 'updateGeoprocessing'])
        ->middleware(['auth:sanctum', 'permission:manage_gis', AuditAdminMutation::class])
        ->name('gis.analysis.update');

    // Agenda: database adalah satu-satunya sumber data resmi.
    Route::get('/agendas', [AgendaController::class, 'index']);
    Route::get('/agenda-categories', [ContentTaxonomyController::class, 'agendaCategories']);
    Route::get('/admin/agendas', [AgendaController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman']);
    Route::get('/admin/agendas/{agenda}', [AgendaController::class, 'show'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman']);
    Route::post('/agendas', [AgendaController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agendas.store');
    Route::put('/agendas/{agenda}', [AgendaController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agendas.update');
    Route::patch('/agendas/{agenda}/publication', [AgendaController::class, 'updatePublication'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agendas.publication.update');
    Route::delete('/agendas/{agenda}', [AgendaController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agendas.destroy');
    Route::post('/agenda-categories', [ContentTaxonomyController::class, 'storeAgendaCategory'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agenda-categories.store');
    Route::delete('/agenda-categories/{agendaCategory}', [ContentTaxonomyController::class, 'destroyAgendaCategory'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('agenda-categories.destroy');

    // Pengumuman dan tipe pengumuman.
    Route::get('/pengumuman', [AnnouncementController::class, 'index']);
    Route::get('/pengumuman/{announcement}/attachment', [AnnouncementController::class, 'attachment'])
        ->middleware('throttle:60,1')
        ->name('announcements.attachment');
    Route::get('/announcement-types', [ContentTaxonomyController::class, 'announcementTypes']);
    Route::get('/admin/pengumuman', [AnnouncementController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman']);
    Route::get('/admin/pengumuman/{announcement}', [AnnouncementController::class, 'show'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman']);
    Route::post('/pengumuman', [AnnouncementController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcements.store');
    Route::put('/pengumuman/{announcement}', [AnnouncementController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcements.update');
    Route::patch('/pengumuman/{announcement}/publication', [AnnouncementController::class, 'updatePublication'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcements.publication.update');
    Route::delete('/pengumuman/{announcement}', [AnnouncementController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcements.destroy');
    Route::post('/announcement-types', [ContentTaxonomyController::class, 'storeAnnouncementType'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcement-types.store');
    Route::delete('/announcement-types/{announcementType}', [ContentTaxonomyController::class, 'destroyAnnouncementType'])
        ->middleware(['auth:sanctum', 'permission:manage_pengumuman', AuditAdminMutation::class])
        ->name('announcement-types.destroy');

    // News & Artikel Endpoints (Real Views Counter in Database)
    Route::get('/news', [NewsController::class, 'index']);
    Route::get('/news/{id}', [NewsController::class, 'show']);
    Route::get('/admin/news', [NewsController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', 'permission:manage_berita']);
    Route::get('/admin/news/{news}', [NewsController::class, 'adminShow'])
        ->middleware(['auth:sanctum', 'permission:manage_berita']);
    Route::post('/news', [NewsController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news.store');
    Route::put('/news/{id}', [NewsController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news.update');
    Route::patch('/news/{news}/publication', [NewsController::class, 'updatePublication'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news.publication.update');
    Route::post('/news/{id}/increment-views', [NewsController::class, 'incrementViews'])
        ->middleware('throttle:60,1');
    Route::delete('/news/{id}', [NewsController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news.destroy');
    Route::get('/news-categories', [ContentTaxonomyController::class, 'newsCategories']);
    Route::post('/news-categories', [ContentTaxonomyController::class, 'storeNewsCategory'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news-categories.store');
    Route::delete('/news-categories/{newsCategory}', [ContentTaxonomyController::class, 'destroyNewsCategory'])
        ->middleware(['auth:sanctum', 'permission:manage_berita', AuditAdminMutation::class])
        ->name('news-categories.destroy');

    // Global Unified Search Endpoint
    Route::get('/search', function (Request $request) {
        $q = trim($request->input('q', ''));
        if (empty($q)) {
            return response()->json(['status' => 'success', 'code' => 200, 'data' => []]);
        }

        $results = [];

        // 1. Dokumen
        if (Schema::hasTable('documents') && Schema::hasTable('document_versions')) {
            $docs = DB::table('documents')
                ->join(
                    'document_versions',
                    'documents.current_version_id',
                    '=',
                    'document_versions.id'
                )
                ->where('documents.is_public', true)
                ->where('documents.classification', 'public')
                ->where('documents.governance_status', 'approved')
                ->where('documents.storage_status', 'private')
                ->where('document_versions.status', 'approved')
                ->where('document_versions.integrity_status', 'valid')
                ->where(function ($query) use ($q): void {
                    $query->where('documents.title', 'like', "%{$q}%")
                        ->orWhere('documents.summary', 'like', "%{$q}%")
                        ->orWhere('documents.jenis', 'like', "%{$q}%")
                        ->orWhere('documents.bidang', 'like', "%{$q}%")
                        ->orWhere('documents.archive_code', 'like', "%{$q}%")
                        ->orWhere('documents.document_number', 'like', "%{$q}%")
                        ->orWhere('documents.owner_opd', 'like', "%{$q}%")
                        ->orWhere('documents.keywords', 'like', "%{$q}%")
                        ->orWhere('document_versions.full_text', 'like', "%{$q}%");
                })
                ->select([
                    'documents.id',
                    'documents.title',
                    'documents.summary',
                    'documents.jenis',
                    'documents.bidang',
                    'documents.archive_code',
                    'document_versions.full_text',
                    'document_versions.version_label',
                ])
                ->take(5)
                ->get();
            foreach ($docs as $d) {
                $searchableText = trim(strip_tags(
                    (string) ($d->summary ?: $d->full_text ?: '')
                ));
                $results[] = [
                    'type' => 'dokumen',
                    'category_label' => 'Dokumen Perencanaan',
                    'title' => $d->title,
                    'desc' => $searchableText !== ''
                        ? Str::limit($searchableText, 150)
                        : 'Arsip '.$d->archive_code.' · versi '.$d->version_label,
                    'link' => '/dokumen?preview='.$d->id,
                ];
            }
        }

        // 2. News / Berita
        if (Schema::hasTable('news')) {
            $news = DB::table('news')
                ->where('is_published', true)
                ->where(function ($query) use ($q): void {
                    $query->where('title', 'like', "%{$q}%")
                        ->orWhere('summary', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%");
                })
                ->take(5)->get();
            foreach ($news as $n) {
                $results[] = [
                    'type' => 'berita',
                    'category_label' => $n->category ?? 'Berita Utama',
                    'title' => $n->title,
                    'desc' => $n->summary ?? 'Publikasi resmi Bappeda Halut',
                    'link' => '/berita/'.($n->slug ?? $n->id),
                ];
            }
        }

        // 3. Galeri Foto & Video
        if (Schema::hasTable('galeri')) {
            $gals = DB::table('galeri')
                ->where('is_published', true)
                ->where(function ($query) use ($q): void {
                    $query->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                })
                ->take(5)->get();
            foreach ($gals as $g) {
                $results[] = [
                    'type' => 'galeri',
                    'category_label' => $g->category ?? 'Galeri Foto',
                    'title' => $g->title,
                    'desc' => $g->description ?? 'Dokumentasi kegiatan pembangunan',
                    'link' => '/galeri',
                ];
            }
        }

        // 4. Pengumuman
        if (Schema::hasTable('announcements')) {
            $ann = DB::table('announcements')
                ->where('is_published', true)
                ->where(function ($query): void {
                    $query->whereNull('valid_until')
                        ->orWhereDate('valid_until', '>=', today());
                })
                ->where(function ($query) use ($q): void {
                    $query->where('title', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%");
                })
                ->take(5)->get();
            foreach ($ann as $a) {
                $results[] = [
                    'type' => 'pengumuman',
                    'category_label' => 'Pengumuman Resmi',
                    'title' => $a->title,
                    'desc' => substr(strip_tags($a->content ?? ''), 0, 100),
                    'link' => '/pengumuman',
                ];
            }
        }

        // 5. GIS & Proyek Pembangunan
        if (Schema::hasTable('proyek_details') && Schema::hasTable('documents')) {
            $gis = DB::table('proyek_details')
                ->join('documents', 'proyek_details.document_id', '=', 'documents.id')
                ->where('documents.is_public', true)
                ->where('documents.classification', 'public')
                ->where('documents.governance_status', 'approved')
                ->where('documents.storage_status', 'private')
                ->where(function ($query) use ($q): void {
                    $query->where('proyek_details.nama_proyek', 'like', "%{$q}%")
                        ->orWhere('proyek_details.lokasi_deskripsi', 'like', "%{$q}%")
                        ->orWhere('proyek_details.kecamatan', 'like', "%{$q}%");
                })
                ->select('proyek_details.*')
                ->take(5)->get();
            foreach ($gis as $p) {
                $results[] = [
                    'type' => 'gis',
                    'category_label' => 'Peta GIS Infrastruktur',
                    'title' => $p->nama_proyek,
                    'desc' => 'Lokasi: '.($p->lokasi_deskripsi ?? $p->kecamatan ?? 'Halmahera Utara'),
                    'link' => '/gis-peta',
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $results,
        ]);
    })->middleware('throttle:60,1');

    // Profil Endpoints (Tentang, Visi-Misi, Tugas-Fungsi, Dasar-Hukum)
    Route::get('/profil', [ProfilController::class, 'index']);
    Route::get('/profil/{key}', [ProfilController::class, 'show']);
    Route::post('/profil/{key}', [ProfilController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('profile.update.post');
    Route::put('/profil/{key}', [ProfilController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('profile.update.put');

    // Pejabat & Org Structure Endpoints (Direct Access for Dashboard & Public View)
    Route::get('/pejabat', [PejabatController::class, 'index']);
    Route::get('/pejabat/{id}', [PejabatController::class, 'show']);
    Route::post('/pejabat', [PejabatController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('officials.store');
    Route::post('/pejabat/bulk-update', [PejabatController::class, 'bulkUpdate'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('officials.bulk-update');
    Route::post('/pejabat/save-positions', [PejabatController::class, 'savePositions'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('officials.positions.save');
    Route::put('/pejabat/{id}', [PejabatController::class, 'update'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('officials.update');
    Route::delete('/pejabat/{id}', [PejabatController::class, 'destroy'])
        ->middleware(['auth:sanctum', 'permission:manage_profil', AuditAdminMutation::class])
        ->name('officials.destroy');

    // Protected Endpoints (Sanctum Auth)
    Route::middleware(['auth:sanctum', AuditAdminMutation::class])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])
            ->name('auth.logout');
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/profile', [AuthController::class, 'updateProfile'])
            ->name('auth.profile.update');
        Route::put('/auth/password', [AuthController::class, 'updatePassword'])
            ->name('auth.password.update');
        Route::get('/document-download-logs', [DocumentAnalyticsController::class, 'downloadLogs'])
            ->middleware('permission:view_download_logs');

        // User Management (Superadmin)
        Route::middleware(['role:superadmin', 'permission:manage_users'])->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store'])
                ->name('users.store');
            Route::put('/users/{id}', [UserController::class, 'update'])
                ->name('users.update');
            Route::delete('/users/{id}', [UserController::class, 'destroy'])
                ->name('users.destroy');
        });
    });
});
