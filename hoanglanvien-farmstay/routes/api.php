<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\Api\BungalowController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\MotorbikeController;
use App\Http\Controllers\Api\UserAuthController;
use App\Http\Controllers\Api\MotorbikeBookingController;

// ==========================================
// 1. API CLIENT (Khách hàng)
// ==========================================
Route::prefix('client')->group(function () {
    Route::get('/bungalows', [BungalowController::class, 'index']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/galleries', [GalleryController::class, 'index']);
    Route::post('/check-availability', [BookingController::class, 'checkAvailability']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::post('/motorbike-bookings', [\App\Http\Controllers\Api\MotorbikeBookingController::class, 'store']);
    Route::post('/register', [UserAuthController::class, 'register']);
    Route::post('/login', [UserAuthController::class, 'login']);
});

// ==========================================
// 2. API ADMIN (Quản trị)
// ==========================================
Route::post('/admin/login', [AuthController::class, 'login']);

Route::prefix('admin')->group(function () {
    Route::apiResource('bungalows', BungalowController::class);
    Route::post('/bungalows/{id}/update', [BungalowController::class, 'updateWithPost']);
    Route::apiResource('menu-items', MenuItemController::class);
    Route::post('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::get('/bookings', [BookingController::class, 'index']);

    Route::get('galleries', [GalleryController::class, 'index']);
    Route::post('galleries', [GalleryController::class, 'store']);
    Route::delete('galleries/{id}', [GalleryController::class, 'destroy']);
    // QUẢN LÝ XE MÁY
    Route::apiResource('motorbikes', MotorbikeController::class);
    Route::post('/motorbikes/{id}/update', [MotorbikeController::class, 'updateWithPost']);
    
    // QUẢN LÝ ĐẶT XE
    Route::get('/motorbike-bookings', [MotorbikeBookingController::class, 'index']);
    Route::post('/motorbike-bookings/{id}/status', [MotorbikeBookingController::class, 'updateStatus']);
});

// ==========================================
// 3. API BẢO MẬT
// ==========================================
Route::middleware(['auth:sanctum', 'role.admin'])->prefix('admin/secure')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', function (Request $request) {
        return response()->json(['success' => true, 'data' => $request->user()]);
    });
});