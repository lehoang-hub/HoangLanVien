<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Nếu có user đăng nhập và role thuộc nhóm quản trị thì cho đi tiếp
        if ($user && in_array($user->role, ['super_admin', 'manager', 'receptionist'])) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Bạn không có quyền truy cập tính năng này.'
        ], 403);
    }
}