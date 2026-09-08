<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardChartController extends Controller
{
    /**
     * Get all dashboard charts data from database
     */
    public function index()
    {
        // 1. Makro APBD Bulanan
        $monthlyTrends = DB::table('realisasi_apbd_monthly')
            ->orderBy('month_order', 'asc')
            ->get(['id', 'month', 'keuangan', 'fisik']);

        // 2. Target Sektoral Makro
        $programPerformance = DB::table('program_sektoral')
            ->orderBy('order_index', 'asc')
            ->get(['id', 'sector', 'realisasi', 'target', 'color', 'text_color as textColor']);

        // 3. Riil Proyek Geotagging (Operasional)
        $projectCount = DB::table('proyek_details')->count();
        $projectStatuses = DB::table('proyek_details')
            ->selectRaw('status_progres, count(*) as count')
            ->groupBy('status_progres')
            ->pluck('count', 'status_progres');

        $totalPagu = (float) DB::table('proyek_details')->sum('pagu_anggaran');
        $totalRealisasi = (float) DB::table('proyek_details')->sum('realisasi_anggaran');
        $avgProgress = (float) round(DB::table('proyek_details')->avg('persentase_progres') ?? 0, 1);

        $projectsByBidang = DB::table('proyek_details')
            ->selectRaw('bidang, count(*) as total_proyek, round(avg(persentase_progres), 1) as avg_progres, sum(pagu_anggaran) as total_pagu, sum(realisasi_anggaran) as total_realisasi')
            ->groupBy('bidang')
            ->get();

        // 4. Dokumen Publik & Riwayat Unduhan
        $topDocuments = DB::table('documents')
            ->orderBy('downloads', 'desc')
            ->take(5)
            ->get(['id', 'title', 'jenis', 'tahun', 'downloads', 'views']);

        $totalDownloads = (int) DB::table('documents')->sum('downloads');

        // 5. IKM Kepuasan Warga
        $surveyCount = DB::table('surveys')->count();
        $avgIkm = (float) round(DB::table('surveys')->avg('ikm_score') ?? 0, 1);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'monthly_trends' => $monthlyTrends,
                'program_performance' => $programPerformance,
                'projects_summary' => [
                    'total_projects' => $projectCount,
                    'status_counts' => [
                        'selesai' => (int) ($projectStatuses['selesai'] ?? 0),
                        'dalam_proses' => (int) ($projectStatuses['dalam_proses'] ?? 0),
                        'belum_mulai' => (int) ($projectStatuses['belum_mulai'] ?? 0),
                        'terkendala' => (int) ($projectStatuses['terkendala'] ?? 0),
                    ],
                    'total_pagu' => $totalPagu,
                    'total_realisasi' => $totalRealisasi,
                    'serapan_persen' => $totalPagu > 0 ? round(($totalRealisasi / $totalPagu) * 100, 1) : 0,
                    'avg_progress' => $avgProgress,
                    'by_bidang' => $projectsByBidang,
                ],
                'public_engagement' => [
                    'total_downloads' => $totalDownloads,
                    'top_documents' => $topDocuments,
                    'survey_count' => $surveyCount,
                    'avg_ikm' => $avgIkm,
                ],
                'meta' => [
                    'source_text' => 'Sistem Informasi Akuntansi Keuangan Daerah & Geotagging BAPPEDA Halut',
                    'status_text' => 'Q3 2026 Status: 89.4% (On-Track)',
                    'total_target_met' => count($programPerformance),
                ],
            ],
        ]);
    }

    /**
     * Batch update monthly trends and program performance
     */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'monthly' => 'nullable|array',
            'monthly.*.id' => 'required_with:monthly|integer',
            'monthly.*.keuangan' => 'required_with:monthly|numeric|min:0|max:100',
            'monthly.*.fisik' => 'required_with:monthly|numeric|min:0|max:100',
            'programs' => 'nullable|array',
            'programs.*.id' => 'required_with:programs|integer',
            'programs.*.realisasi' => 'required_with:programs|numeric|min:0|max:100',
            'programs.*.target' => 'required_with:programs|numeric|min:0|max:100',
        ]);

        if (!empty($validated['monthly'])) {
            foreach ($validated['monthly'] as $m) {
                DB::table('realisasi_apbd_monthly')
                    ->where('id', $m['id'])
                    ->update([
                        'keuangan' => $m['keuangan'],
                        'fisik' => $m['fisik'],
                        'updated_at' => now(),
                    ]);
            }
        }

        if (!empty($validated['programs'])) {
            foreach ($validated['programs'] as $p) {
                DB::table('program_sektoral')
                    ->where('id', $p['id'])
                    ->update([
                        'realisasi' => $p['realisasi'],
                        'target' => $p['target'],
                        'updated_at' => now(),
                    ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data grafik berhasil diperbarui',
        ]);
    }

    /**
     * Update or add monthly APBD trend data
     */
    public function updateMonthly(Request $request, $id)
    {
        $validated = $request->validate([
            'keuangan' => 'numeric|min:0|max:100',
            'fisik' => 'numeric|min:0|max:100',
        ]);

        DB::table('realisasi_apbd_monthly')
            ->where('id', $id)
            ->update([
                'keuangan' => $validated['keuangan'],
                'fisik' => $validated['fisik'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Monthly trend updated successfully',
        ]);
    }

    /**
     * Update program sektoral performance data
     */
    public function updateProgram(Request $request, $id)
    {
        $validated = $request->validate([
            'realisasi' => 'numeric|min:0|max:100',
            'target' => 'numeric|min:0|max:100',
        ]);

        DB::table('program_sektoral')
            ->where('id', $id)
            ->update([
                'realisasi' => $validated['realisasi'],
                'target' => $validated['target'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Program sektoral performance updated successfully',
        ]);
    }
}

