<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use DB;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function index()
    {
        $surveys = Survey::query()->latest()->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'surveys' => $surveys,
                'summary' => $this->buildSummary($surveys),
            ],
        ]);
    }

    public function publicSummary()
    {
        $surveys = Survey::query()
            ->select([
                'ikm_score',
                'u1_persyaratan',
                'u2_prosedur',
                'u3_kecepatan',
                'u4_produk',
                'u5_sikap',
            ])
            ->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => [
                'summary' => $this->buildSummary($surveys),
            ],
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
            ],
        ]);
    }

    public function storeQuestion(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:500',
            'description' => 'nullable|string|max:2000',
            'service_id' => 'nullable|integer|exists:survey_services,id',
            'question_type' => 'nullable|string|in:rating,text,textarea,select',
            'options' => 'nullable|string|max:20000',
            'is_required' => 'nullable|boolean',
        ]);

        $maxOrder = DB::table('survey_questions')->max('order_index') ?? 0;

        $id = DB::table('survey_questions')->insertGetId([
            'service_id' => $request->service_id ? $request->service_id : null,
            'title' => $request->title,
            'description' => $request->description,
            'question_type' => $request->question_type ?? 'rating',
            'options' => $request->options,
            'is_required' => $request->has('is_required') ? (bool) $request->is_required : false,
            'order_index' => $maxOrder + 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan baru berhasil ditambahkan.',
            'data' => DB::table('survey_questions')->find($id),
        ]);
    }

    public function updateQuestion(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:500',
            'description' => 'nullable|string|max:2000',
            'service_id' => 'nullable|integer|exists:survey_services,id',
            'question_type' => 'nullable|string|in:rating,text,textarea,select',
            'options' => 'nullable|string|max:20000',
            'is_required' => 'nullable|boolean',
        ]);

        DB::table('survey_questions')->where('id', $id)->update([
            'service_id' => $request->service_id ? $request->service_id : null,
            'title' => $request->title,
            'description' => $request->description,
            'question_type' => $request->question_type ?? 'rating',
            'options' => $request->options,
            'is_required' => $request->has('is_required') ? (bool) $request->is_required : false,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan berhasil diperbarui.',
            'data' => DB::table('survey_questions')->find($id),
        ]);
    }

    public function deleteQuestion($id)
    {
        DB::table('survey_questions')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pertanyaan berhasil dihapus.',
        ]);
    }

    public function reorderQuestions(Request $request)
    {
        $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'required|integer|distinct|exists:survey_questions,id',
        ]);

        foreach ($request->ordered_ids as $index => $id) {
            DB::table('survey_questions')->where('id', $id)->update([
                'order_index' => $index + 1,
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Urutan pertanyaan berhasil disimpan.',
        ]);
    }

    public function storeService(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
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
            'data' => DB::table('survey_services')->find($id),
        ]);
    }

    public function deleteService($id)
    {
        DB::table('survey_services')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Opsi jenis layanan berhasil dihapus.',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_responden' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:254',
            'pekerjaan' => 'nullable|string|max:100',
            'jenis_layanan' => 'required|string|max:255',
            'u1_persyaratan' => 'required|integer|min:1|max:5',
            'u2_prosedur' => 'required|integer|min:1|max:5',
            'u3_kecepatan' => 'required|integer|min:1|max:5',
            'u4_produk' => 'required|integer|min:1|max:5',
            'u5_sikap' => 'required|integer|min:1|max:5',
            'saran_masukan' => 'nullable|string|max:5000',
        ]);

        $u1 = (int) $request->u1_persyaratan;
        $u2 = (int) $request->u2_prosedur;
        $u3 = (int) $request->u3_kecepatan;
        $u4 = (int) $request->u4_produk;
        $u5 = (int) $request->u5_sikap;

        // PermenPAN-RB 5 Star Scale Formula: (Raw Avg / 5) * 100
        $rawAvg = ($u1 + $u2 + $u3 + $u4 + $u5) / 5;
        $ikmScore = ($rawAvg / 5) * 100;

        $survey = Survey::query()->create([
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
                'id' => $survey->id,
                'ikm_score' => round($ikmScore, 2),
            ],
        ], 201);
    }

    private function buildSummary($surveys): array
    {
        $totalResponden = $surveys->count();
        $avgScore = $totalResponden > 0 ? (float) $surveys->avg('ikm_score') : 0;

        if ($avgScore >= 88.31) {
            [$mutu, $kategori] = ['A', 'Sangat Baik'];
        } elseif ($avgScore >= 76.61) {
            [$mutu, $kategori] = ['B', 'Baik'];
        } elseif ($avgScore >= 65.00) {
            [$mutu, $kategori] = ['C', 'Kurang Baik'];
        } elseif ($totalResponden > 0) {
            [$mutu, $kategori] = ['D', 'Tidak Baik'];
        } else {
            [$mutu, $kategori] = ['-', 'Belum Ada Data'];
        }

        return [
            'total_responden' => $totalResponden,
            'ikm_score' => round($avgScore, 2),
            'mutu_pelayanan' => $mutu,
            'kategori' => $kategori,
            'u1_avg' => round($surveys->avg('u1_persyaratan') ?? 0, 2),
            'u2_avg' => round($surveys->avg('u2_prosedur') ?? 0, 2),
            'u3_avg' => round($surveys->avg('u3_kecepatan') ?? 0, 2),
            'u4_avg' => round($surveys->avg('u4_produk') ?? 0, 2),
            'u5_avg' => round($surveys->avg('u5_sikap') ?? 0, 2),
        ];
    }
}
