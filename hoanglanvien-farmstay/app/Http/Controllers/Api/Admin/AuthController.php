<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        // Kiểm tra tài khoản và mật khẩu
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác.'
            ], 401);
        }

        // Kiểm tra quyền (Chỉ cho phép những role có quyền quản trị)
        if (!in_array($user->role, ['super_admin', 'manager', 'receptionist'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản không có quyền truy cập trang quản trị.'
            ], 403);
        }

        // Tạo API Token bằng Sanctum
        $token = $user->createToken('admin_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ]
        ]);
    }

    // Đăng xuất và xóa token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng xuất thành công'
        ]);
    }
}