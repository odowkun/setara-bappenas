<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = DB::table('audit_logs')
            ->select([
                'id',
                'user_name',
                'user_role',
                'action',
                'details',
                'ip_address',
                'created_at',
            ])
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $logs,
        ]);
    }
}
