<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardChartController;
use App\Http\Controllers\Api\DocumentAnalyticsController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\GaleriController;
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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Dashboard Charts Endpoints
    Route::get('/dashboard/charts', [DashboardChartController::class, 'index']);
    Route::put('/dashboard/charts/realisasi-apbd/{id}', [DashboardChartController::class, 'updateMonthly']);
    Route::put('/dashboard/charts/program-sektoral/{id}', [DashboardChartController::class, 'updateProgram']);
    // Galeri Endpoints
    Route::get('/galeri', [GaleriController::class, 'index']);
    Route::post('/galeri', [GaleriController::class, 'store']);
    Route::delete('/galeri/{id}', [GaleriController::class, 'destroy']);
    // Tautan OPD Endpoints
    Route::get('/tautan-opd', [TautanOpdController::class, 'index']);
    Route::post('/tautan-opd/upload-logo', [TautanOpdController::class, 'uploadLogo']);
    Route::post('/tautan-opd', [TautanOpdController::class, 'store']);
    Route::put('/tautan-opd/{id}', [TautanOpdController::class, 'update']);
    Route::delete('/tautan-opd/{id}', [TautanOpdController::class, 'destroy']);
    // Audit Logs Endpoint
    Route::get('/audit-logs', function () {
        $logs = DB::table('audit_logs')->orderBy('id', 'desc')->take(50)->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $logs,
        ]);
    });
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents/{id}/preview', [DocumentAnalyticsController::class, 'preview']);
    Route::post('/documents/{id}/download', [DocumentAnalyticsController::class, 'download']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
    Route::post('/documents/upload-chunk', [DocumentController::class, 'uploadChunk']); // Resumable Chunked Upload
    Route::post('/media/upload-optimized', [MediaController::class, 'uploadMedia']); // Dual Variant Media Optimization
    // Dynamic Jenis Dokumen Management Endpoints
    Route::get('/jenis-dokumen', [JenisDokumenController::class, 'index']);
    Route::post('/jenis-dokumen', [JenisDokumenController::class, 'store']);
    Route::delete('/jenis-dokumen/{id}', [JenisDokumenController::class, 'destroy']);

    // Survey Kepuasan & Kritik Saran Routes
    Route::get('/surveys', [SurveyController::class, 'index']);
    Route::get('/surveys/config', [SurveyController::class, 'getConfig']);
    Route::post('/surveys/questions', [SurveyController::class, 'storeQuestion']);
    Route::post('/surveys/questions/reorder', [SurveyController::class, 'reorderQuestions']);
    Route::put('/surveys/questions/{id}', [SurveyController::class, 'updateQuestion']);
    Route::delete('/surveys/questions/{id}', [SurveyController::class, 'deleteQuestion']);
    Route::post('/surveys/services', [SurveyController::class, 'storeService']);
    Route::delete('/surveys/services/{id}', [SurveyController::class, 'deleteService']);
    Route::post('/surveys', [SurveyController::class, 'store']);
    Route::get('/kritik', [KritikController::class, 'index']);
    Route::post('/kritik', [KritikController::class, 'store']);
    Route::put('/kritik/{id}/tanggapan', [KritikController::class, 'updateTanggapan']);

    // Fitur 2 - 5: Geotagging Proyek, Tabular Update, Attachments & Geoprocessing
    Route::get('/proyek-details', [ProyekDetailController::class, 'index']);
    Route::get('/proyek-details/{id}', [ProyekDetailController::class, 'show']);
    Route::post('/documents/{documentId}/proyek', [ProyekDetailController::class, 'store']); // Fitur 2
    Route::put('/proyek-details/{id}/progres', [ProyekDetailController::class, 'updateProgres']); // Fitur 3
    Route::post('/proyek-details/{id}/attachment', [ProyekDetailController::class, 'uploadAttachment']); // Fitur 4
    Route::delete('/proyek-details/{id}', [ProyekDetailController::class, 'destroy']);
    Route::delete('/proyek-attachments/{attachmentId}', [ProyekDetailController::class, 'deleteAttachment']);
    Route::post('/gis/geoprocessing/buffer', [ProyekDetailController::class, 'geoprocessingBuffer']); // Fitur 5

    // News & Artikel Endpoints (Real Views Counter in Database)
    Route::get('/news', [NewsController::class, 'index']);
    Route::get('/news/{id}', [NewsController::class, 'show']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{id}', [NewsController::class, 'update']);
    Route::post('/news/{id}/increment-views', [NewsController::class, 'incrementViews']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);

    // Global Unified Search Endpoint
    Route::get('/search', function (Request $request) {
        $q = trim($request->input('q', ''));
        if (empty($q)) {
            return response()->json(['status' => 'success', 'code' => 200, 'data' => []]);
        }

        $results = [];

        // 1. Dokumen
        if (Schema::hasTable('documents')) {
            $docs = DB::table('documents')
                ->where('title', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%")
                ->take(5)->get();
            foreach ($docs as $d) {
                $results[] = [
                    'type' => 'dokumen',
                    'category_label' => 'Dokumen Perencanaan',
                    'title' => $d->title,
                    'desc' => $d->description ?? $d->category ?? 'Dokumen Resmi Bappeda Halut',
                    'link' => '/dokumen',
                ];
            }
        }

        // 2. News / Berita
        if (Schema::hasTable('news')) {
            $news = DB::table('news')
                ->where('title', 'like', "%{$q}%")
                ->orWhere('summary', 'like', "%{$q}%")
                ->orWhere('content', 'like', "%{$q}%")
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
                ->where('title', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%")
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
                ->where('title', 'like', "%{$q}%")
                ->orWhere('content', 'like', "%{$q}%")
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
        if (Schema::hasTable('proyek_details')) {
            $gis = DB::table('proyek_details')
                ->where('nama_proyek', 'like', "%{$q}%")
                ->orWhere('lokasi', 'like', "%{$q}%")
                ->orWhere('kecamatan', 'like', "%{$q}%")
                ->take(5)->get();
            foreach ($gis as $p) {
                $results[] = [
                    'type' => 'gis',
                    'category_label' => 'Peta GIS Infrastruktur',
                    'title' => $p->nama_proyek,
                    'desc' => 'Lokasi: '.($p->lokasi ?? $p->kecamatan ?? 'Halmahera Utara'),
                    'link' => '/gis-peta',
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $results,
        ]);
    });

    Route::get('/pengumuman', function () {
        if (Schema::hasTable('announcements')) {
            $data = DB::table('announcements')->orderBy('id', 'desc')->get();

            return response()->json(['status' => 'success', 'code' => 200, 'data' => $data]);
        }

        return response()->json(['status' => 'success', 'code' => 200, 'data' => []]);
    });

    // Profil Endpoints (Tentang, Visi-Misi, Tugas-Fungsi, Dasar-Hukum)
    Route::get('/profil', [ProfilController::class, 'index']);
    Route::get('/profil/{key}', [ProfilController::class, 'show']);
    Route::post('/profil/{key}', [ProfilController::class, 'update']);
    Route::put('/profil/{key}', [ProfilController::class, 'update']);

    // Pejabat & Org Structure Endpoints (Direct Access for Dashboard & Public View)
    Route::get('/pejabat', [PejabatController::class, 'index']);
    Route::get('/pejabat/{id}', [PejabatController::class, 'show']);
    Route::post('/pejabat', [PejabatController::class, 'store']);
    Route::post('/pejabat/bulk-update', [PejabatController::class, 'bulkUpdate']);
    Route::post('/pejabat/save-positions', [PejabatController::class, 'savePositions']);
    Route::put('/pejabat/{id}', [PejabatController::class, 'update']);
    Route::delete('/pejabat/{id}', [PejabatController::class, 'destroy']);

    // Protected Endpoints (Sanctum Auth)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/document-download-logs', [DocumentAnalyticsController::class, 'downloadLogs']);

        // User Management (Superadmin)
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });
});
