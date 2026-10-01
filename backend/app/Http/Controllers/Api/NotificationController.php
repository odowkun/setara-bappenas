<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Document;
use App\Models\Kritik;
use App\Models\News;
use App\Models\Survey;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['status' => 'error', 'code' => 401, 'message' => 'Unauthenticated'], 401);
        }

        $notifications = collect();
        $isSuperAdmin = $user->hasRole('superadmin');

        // 1. Kritik & Saran (Aspirasi Warga)
        if ($isSuperAdmin || $user->hasPermissionTo('manage_kritik')) {
            if (Schema::hasTable('kritiks')) {
                $kritiks = Kritik::query()
                    ->latest('id')
                    ->take(8)
                    ->get();

                foreach ($kritiks as $k) {
                    $isPending = empty($k->catatan_balasan) || Str::lower($k->status ?? '') === 'menunggu tanggapan';
                    $notifications->push([
                        'id' => 'kritik-' . $k->id,
                        'type' => 'kritik',
                        'title' => $isPending ? 'Aspirasi Warga Menunggu Tanggapan' : 'Kritik & Saran Warga',
                        'message' => ($k->nama ? $k->nama . ': ' : '') . Str::limit($k->subjek ?: $k->pesan, 90),
                        'category' => 'Kritik & Saran',
                        'link' => '/dashboard/kritik-saran',
                        'created_at' => $k->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $k->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => $isPending,
                    ]);
                }
            }
        }

        // 2. Survei Kepuasan Masyarakat (IKM)
        if ($isSuperAdmin || $user->hasPermissionTo('manage_survey')) {
            if (Schema::hasTable('surveys')) {
                $surveys = Survey::query()
                    ->latest('id')
                    ->take(8)
                    ->get();

                foreach ($surveys as $s) {
                    $score = floatval($s->ikm_score ?? 0);
                    $isLowScore = $score > 0 && $score < 65;
                    $notifications->push([
                        'id' => 'survey-' . $s->id,
                        'type' => 'ikm',
                        'title' => $isLowScore ? 'Survei IKM Perlu Evaluasi' : 'Responden Survei IKM Baru',
                        'message' => 'Responden ' . ($s->nama_responden ?: 'Warga') . ' mengisi survei: Nilai IKM ' . ($s->ikm_score ?: '-') . ' (' . ($s->kategori ?? 'Tercatat') . ')',
                        'category' => 'Survei IKM',
                        'link' => '/dashboard/survey-kepuasan',
                        'created_at' => $s->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $s->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => $isLowScore,
                    ]);
                }
            }
        }

        // 3. Dokumen Perencanaan (Arsip / Tata Kelola)
        if ($isSuperAdmin || $user->hasPermissionTo('manage_dokumen')) {
            if (Schema::hasTable('documents')) {
                $docQuery = Document::query()->latest('id');

                // Scope bidang if admin_bidang with specific bidang
                if (! $isSuperAdmin && $user->role === 'admin_bidang' && ! empty($user->bidang) && $user->bidang !== 'semua') {
                    $docQuery->where(function ($q) use ($user) {
                        $q->where('bidang', $user->bidang)
                            ->orWhere('bidang', 'semua');
                    });
                }

                $docs = $docQuery->take(8)->get();

                foreach ($docs as $d) {
                    $needsReview = in_array(Str::lower($d->governance_status ?? ''), ['draft', 'in_review', 'submitted']);
                    $notifications->push([
                        'id' => 'dokumen-' . $d->id,
                        'type' => 'dokumen',
                        'title' => $needsReview ? 'Dokumen Perlu Review & Persetujuan' : 'Dokumen Perencanaan Baru',
                        'message' => Str::limit($d->title, 80) . ' (' . strtoupper($d->bidang ?? 'Umum') . ')',
                        'category' => 'Repository Dokumen',
                        'link' => '/dashboard/dokumen',
                        'created_at' => $d->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $d->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => $needsReview,
                    ]);
                }
            }
        }

        // 4. Riwayat Unduhan Dokumen
        if ($isSuperAdmin || $user->hasPermissionTo('view_download_logs')) {
            if (Schema::hasTable('document_download_logs')) {
                $downloads = DB::table('document_download_logs')
                    ->leftJoin('documents', 'document_download_logs.document_id', '=', 'documents.id')
                    ->select([
                        'document_download_logs.id',
                        'document_download_logs.email',
                        'document_download_logs.created_at',
                        'documents.title as document_title',
                    ])
                    ->latest('document_download_logs.id')
                    ->take(5)
                    ->get();

                foreach ($downloads as $dl) {
                    $notifications->push([
                        'id' => 'download-' . $dl->id,
                        'type' => 'download',
                        'title' => 'Pengunduhan Dokumen Publik',
                        'message' => ($dl->email ?: 'Pengguna anonim') . ' mengunduh ' . Str::limit($dl->document_title ?? 'Dokumen Perencanaan', 50),
                        'category' => 'Riwayat Unduh',
                        'link' => '/dashboard/dokumen/riwayat-unduhan',
                        'created_at' => $dl->created_at ? Carbon::parse($dl->created_at)->toIso8601String() : now()->toIso8601String(),
                        'timestamp' => $dl->created_at ? Carbon::parse($dl->created_at)->timestamp : now()->timestamp,
                        'is_urgent' => false,
                    ]);
                }
            }
        }

        // 5. Berita & Publikasi Humas
        if ($isSuperAdmin || $user->hasPermissionTo('manage_berita')) {
            if (Schema::hasTable('news')) {
                $news = News::query()->latest('id')->take(5)->get();
                foreach ($news as $n) {
                    $isDraft = ! $n->is_published;
                    $notifications->push([
                        'id' => 'news-' . $n->id,
                        'type' => 'berita',
                        'title' => $isDraft ? 'Draf Berita Menunggu Rilis' : 'Berita Humas Terbit',
                        'message' => Str::limit($n->title, 80),
                        'category' => 'Warta Berita',
                        'link' => '/dashboard/berita',
                        'created_at' => $n->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $n->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => $isDraft,
                    ]);
                }
            }
        }

        // 6. Pengumuman Resmi
        if ($isSuperAdmin || $user->hasPermissionTo('manage_pengumuman')) {
            if (Schema::hasTable('announcements')) {
                $announcements = Announcement::query()->latest('id')->take(5)->get();
                foreach ($announcements as $a) {
                    $notifications->push([
                        'id' => 'announcement-' . $a->id,
                        'type' => 'pengumuman',
                        'title' => 'Pengumuman Resmi Baru',
                        'message' => Str::limit($a->title, 80),
                        'category' => 'Pengumuman',
                        'link' => '/dashboard/pengumuman',
                        'created_at' => $a->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $a->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => false,
                    ]);
                }
            }
        }

        // 7. Pengelolaan User (Superadmin / manage_users)
        if ($isSuperAdmin || $user->hasPermissionTo('manage_users')) {
            if (Schema::hasTable('users')) {
                $users = User::query()
                    ->where('id', '!=', $user->id)
                    ->latest('id')
                    ->take(5)
                    ->get();

                foreach ($users as $u) {
                    $notifications->push([
                        'id' => 'user-' . $u->id,
                        'type' => 'users',
                        'title' => 'Akun Pengelola Terdaftar',
                        'message' => $u->name . ' (' . ucfirst($u->role) . ' - ' . strtoupper($u->bidang ?: 'Semua') . ')',
                        'category' => 'Kelola User',
                        'link' => '/dashboard/users',
                        'created_at' => $u->created_at?->toIso8601String() ?? now()->toIso8601String(),
                        'timestamp' => $u->created_at?->timestamp ?? now()->timestamp,
                        'is_urgent' => false,
                    ]);
                }
            }
        }

        // 8. Audit Log Sistem (Security & Mutation tracking)
        if ($isSuperAdmin || $user->hasPermissionTo('view_audit_logs')) {
            if (Schema::hasTable('audit_logs')) {
                $logs = DB::table('audit_logs')
                    ->where('user_name', '!=', $user->name)
                    ->latest('id')
                    ->take(6)
                    ->get();

                foreach ($logs as $l) {
                    $actionLabel = Str::headline(strtolower(str_replace('_', ' ', $l->action ?? 'mutasi data')));
                    $notifications->push([
                        'id' => 'audit-' . $l->id,
                        'type' => 'system',
                        'title' => 'Aktivitas: ' . $actionLabel,
                        'message' => ($l->user_name ?: 'Admin') . ' (' . ($l->user_role ?: 'staff') . ') ' . Str::limit($l->details ?? '', 60),
                        'category' => 'Audit Keamanan',
                        'link' => '/dashboard/audit-logs',
                        'created_at' => $l->created_at ? Carbon::parse($l->created_at)->toIso8601String() : now()->toIso8601String(),
                        'timestamp' => $l->created_at ? Carbon::parse($l->created_at)->timestamp : now()->timestamp,
                        'is_urgent' => false,
                    ]);
                }
            }
        }

        // Sort by timestamp descending
        $sorted = $notifications
            ->sortByDesc('timestamp')
            ->values()
            ->take(20)
            ->map(function ($item) {
                $carbon = Carbon::parse($item['created_at']);
                $item['time'] = $carbon->locale('id')->diffForHumans();

                return $item;
            });

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $sorted,
            'meta' => [
                'total' => $sorted->count(),
                'role' => $user->role,
                'bidang' => $user->bidang,
            ],
        ]);
    }
}
