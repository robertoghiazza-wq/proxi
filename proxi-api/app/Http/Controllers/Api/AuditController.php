<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['coordinatore', 'admin'], true), 403);

        $limit = min((int) $request->input('limit', 100), 500);

        $log = AuditLog::where('institution_id', $user->institution_id)
            ->with('user:id,name')
            ->when($request->auditable_type, fn ($q, $t) => $q->where('auditable_type', ucfirst($t)))
            ->when($request->auditable_id, fn ($q, $id) => $q->where('auditable_id', $id))
            ->when($request->user_id, fn ($q, $id) => $q->where('user_id', $id))
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return response()->json($log);
    }
}
