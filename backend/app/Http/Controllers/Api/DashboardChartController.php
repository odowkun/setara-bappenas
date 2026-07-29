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
        $monthlyTrends = DB::table('realisasi_apbd_monthly')
            ->orderBy('month_order', 'asc')
            ->get(['id', 'month', 'keuangan', 'fisik']);

        $programPerformance = DB::table('program_sektoral')
            ->orderBy('order_index', 'asc')
            ->get(['id', 'sector', 'realisasi', 'target', 'color', 'text_color as textColor']);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'monthly_trends' => $monthlyTrends,
                'program_performance' => $programPerformance,
                'meta' => [
                    'source_text' => 'Sistem Informasi Akuntansi Keuangan Daerah BAPPEDA Halut',
                    'status_text' => 'Q3 2026 Status: 89.4% (On-Track)',
                    'total_target_met' => count($programPerformance),
                ],
            ],
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
