<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserAuthController extends Controller
{
    // 1. Hàm xử lý Đăng ký
    public function register(Request $request)
    {
        // Validate dữ liệu gửi lên từ React
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        // Tạo tài khoản mới vào cơ sở dữ liệu
        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Mã hóa mật khẩu
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công!'
        ], 201);
    }

    // 2. Hàm xử lý Đăng nhập
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            // Tạo token (nếu bạn dùng Laravel Sanctum)
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => $user
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Email hoặc mật khẩu không chính xác!'
        ], 401);
    }
}