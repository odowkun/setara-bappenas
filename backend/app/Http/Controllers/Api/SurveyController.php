<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;

class SurveyController extends Controller
{
    public function index()
    {
        $surveys = DB::table('surveys')->orderBy('created_at', 'desc')->get();
        
        $totalResponden = count($surveys);
        
        if ($totalResponden > 0) {
            $avgScore = $surveys->avg('ikm_score');
            
            // Mutu Pelayanan PermenPAN-RB
            if ($avgScore >= 88.31) {
                $mutu = 'A';
                $kategori = 'Sangat Baik';
            } elseif ($avgScore >= 76.61) {
                $mutu = 'B';
                $kategori = 'Baik';
            } elseif ($avgScore >= 65.00) {
                $mutu = 'C';
                $kategori = 'Kurang Baik';
            } else {
                $mutu = 'D';
                $kategori = 'Tidak Baik';
            }

            $u1Avg = round($surveys->avg('u1_persyaratan') ?? 0, 2);
            $u2Avg = round($surveys->avg('u2_prosedur') ?? 0, 2);
            $u3Avg = round($surveys->avg('u3_kecepatan') ?? 0, 2);
            $u4Avg = round($surveys->avg('u4_produk') ?? 0, 2);
            $u5Avg = round($surveys->avg('u5_sikap') ?? 0, 2);
        } else {
            $avgScore = 0;
            $mutu = '-';
            $kategori = 'Belum Ada Data';
            $u1Avg = 0;
            $u2Avg = 0;
            $u3Avg = 0;
            $u4Avg = 0;
            $u5Avg = 0;
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'surveys' => $surveys,
                'summary' => [
                    'total_responden' => $totalResponden,
                    'ikm_score' => round($avgScore, 2),
                    'mutu_pelayanan' => $mutu,
                    'kategori' => $kategori,
                    'u1_avg' => $u1Avg,
                    'u2_avg' => $u2Avg,
                    'u3_avg' => $u3Avg,
                    'u4_avg' => $u4Avg,
                    'u5_avg' => $u5Avg,
                ]
            ]
        ]);
    }

    public function getConfig()
    {
        $questions = DB::table('survey_questions')
            ->leftJoin('survey_services', 'survey_questions.service_id', '=', 'survey_services.id')
            ->select('survey_questions.*', 'survey_services.name as service_name')
            ->where('survey_questions.is_active', true)
            ->orderBy('survey_questions.order_index', 'asc')
            ->get();

        $services = DB::table('survey_services')->where('is_active', true)->orderBy('id', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'questions' => $questions,
                'services' => $services,
            ]
        ]);
    }

    public function storeQuestion(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'service_id' => 'nullable|integer',
            'question_type' => 'nullable|string',
            'options' => 'nullable|string',
            'is_required' => 'nullable|boolean',
        ]);

        $maxOrder = DB::table('survey_questions')->max('order_index') ?? 0;

        $id = DB::table('survey_questions')->insertGetId([
            'service_id' => $request->service_id ? $request->service_id : null,
            'title' => $request->title,
            'description' => $request->description,
            'question_type' => $request->question_type ?? 'rating',
            'options' => $request->options,
            'is_required' => $request->has('is_required') ? (bool)$request->is_required : false,
            'order_index' => $maxOrder + 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan baru berhasil ditambahkan.',
            'data' => DB::table('survey_questions')->find($id)
        ]);
    }

    public function updateQuestion(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'service_id' => 'nullable|integer',
            'question_type' => 'nullable|string',
            'options' => 'nullable|string',
            'is_required' => 'nullable|boolean',
        ]);

        DB::table('survey_questions')->where('id', $id)->update([
            'service_id' => $request->service_id ? $request->service_id : null,
            'title' => $request->title,
            'description' => $request->description,
            'question_type' => $request->question_type ?? 'rating',
            'options' => $request->options,
            'is_required' => $request->has('is_required') ? (bool)$request->is_required : false,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan berhasil diperbarui.',
            'data' => DB::table('survey_questions')->find($id)
        ]);
    }

    public function deleteQuestion($id)
    {
        DB::table('survey_questions')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan berhasil dihapus.'
        ]);
    }

    public function reorderQuestions(Request $request)
    {
        $request->validate([
            'ordered_ids' => 'required|array',
        ]);

        foreach ($request->ordered_ids as $index => $id) {
            DB::table('survey_questions')->where('id', $id)->update([
                'order_index' => $index + 1,
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Urutan pertanyaan berhasil disimpan.'
        ]);
    }

    public function storeService(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $id = DB::table('survey_services')->insertGetId([
            'name' => $request->name,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Opsi jenis layanan baru berhasil ditambahkan.',
            'data' => DB::table('survey_services')->find($id)
        ]);
    }

    public function deleteService($id)
    {
        DB::table('survey_services')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Opsi jenis layanan berhasil dihapus.'
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_responden' => 'nullable|string',
            'email' => 'nullable|email',
            'pekerjaan' => 'nullable|string',
            'jenis_layanan' => 'required|string',
            'u1_persyaratan' => 'required|integer|min:1|max:5',
            'u2_prosedur' => 'required|integer|min:1|max:5',
            'u3_kecepatan' => 'required|integer|min:1|max:5',
            'u4_produk' => 'required|integer|min:1|max:5',
            'u5_sikap' => 'required|integer|min:1|max:5',
            'saran_masukan' => 'nullable|string',
        ]);

        $u1 = (int) $request->u1_persyaratan;
        $u2 = (int) $request->u2_prosedur;
        $u3 = (int) $request->u3_kecepatan;
        $u4 = (int) $request->u4_produk;
        $u5 = (int) $request->u5_sikap;

        // PermenPAN-RB 5 Star Scale Formula: (Raw Avg / 5) * 100
        $rawAvg = ($u1 + $u2 + $u3 + $u4 + $u5) / 5;
        $ikmScore = ($rawAvg / 5) * 100;

        $id = DB::table('surveys')->insertGetId([
            'nama_responden' => $request->nama_responden ?? 'Masyarakat umum',
            'email' => $request->email,
            'pekerjaan' => $request->pekerjaan ?? 'Wiraswasta / Publik',
            'jenis_layanan' => $request->jenis_layanan,
            'u1_persyaratan' => $u1,
            'u2_prosedur' => $u2,
            'u3_kecepatan' => $u3,
            'u4_produk' => $u4,
            'u5_sikap' => $u5,
            'ikm_score' => round($ikmScore, 2),
            'saran_masukan' => $request->saran_masukan,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Terima kasih! Survey Kepuasan Anda berhasil dikirim.',
            'data' => [
                'id' => $id,
                'ikm_score' => round($ikmScore, 2),
            ]
        ]);
    }
}
