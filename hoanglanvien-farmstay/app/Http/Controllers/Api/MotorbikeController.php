<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Motorbike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Mail\BookingConfirmationMail;
use Illuminate\Support\Facades\Mail;
use App\Models\Booking;

class MotorbikeController extends Controller

{
    public function storeBooking(Request $request)
    {
        $data = $request->all();
        try {
            Mail::to($data['email'])->send(new BookingConfirmationMail($data));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi gửi mail: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message' => 'Đặt xe thành công và đã gửi email xác nhận!',
            'data' => $data
        ], 200);
    }

    public function index()
    {
        $motorbikes = DB::table('motorbikes')->orderBy('created_at', 'desc')->get();
        return response()->json($motorbikes, 200);
    }

    // Xử lý Thêm mới xe máy (Hỗ trợ nhận mảng ảnh hoặc ảnh đơn Base64)
    // Xử lý Thêm mới xe máy (Hỗ trợ nhận mảng ảnh hoặc ảnh đơn Base64)
    public function store(Request $request)
    {
        // 1. Chỉ validate các cột thực sự tồn tại trong CSDL
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_plate' => 'nullable|string|max:50',
            'base_price' => 'required|numeric',
            'description' => 'nullable|string',
        ]);

        // Nhận dữ liệu lịch từ React
        if ($request->has('daily_status')) {
            $validated['daily_status'] = json_decode($request->daily_status, true);
        }

        $imagePaths = []; 

        if ($request->hasFile('images')) {
            $destinationPath = public_path('storage/Motorbikes');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            foreach ($request->file('images') as $index => $file) {
                $filename = time() . '_' . $index . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                $file->move($destinationPath, $filename);

                $imagePaths[] = 'storage/Motorbikes/' . $filename;
            }
        }

        // 2. Chỉ lưu vào mảng images (KHÔNG lưu cột image số ít)
        $validated['images'] = count($imagePaths) > 0 ? $imagePaths : null;

        // 3. Tạo mới dữ liệu
        $motorbike = Motorbike::create($validated);

        return response()->json([
            'message' => 'Thêm xe máy thành công!',
            'data' => $motorbike
        ], 201);
    }

    public function show($id)
    {
        $motorbike = Motorbike::find($id);
        if (!$motorbike) return response()->json(['message' => 'Không tìm thấy xe máy!'], 404);
        return response()->json($motorbike, 200);
    }

    public function update(Request $request, $id)
    {
        return $this->updateWithPost($request, $id);
    }

    public function destroy($id)
    {
        $motorbike = Motorbike::find($id);
        if (!$motorbike) return response()->json(['message' => 'Không tìm thấy xe máy!'], 404);
        
        $motorbike->delete();
        return response()->json(['message' => 'Xóa Xe máy thành công!'], 200);
    }

    // Xử lý Cập nhật xe máy (Hỗ trợ nhận mảng ảnh Base64 mới, tránh hoàn toàn lỗi 413)
   public function updateWithPost(Request $request, $id)
    {
        $motorbike = Motorbike::findOrFail($id);
        
        $updateData = [
            'name' => $request->name,
            'license_plate' => $request->license_plate,
            'base_price' => $request->base_price,
            'description' => $request->description,
        ];

        // 👉 Nhận và cập nhật lịch trống từ React gửi lên
        if ($request->has('daily_status')) {
            $updateData['daily_status'] = json_decode($request->daily_status, true);
        }

        $motorbike->update($updateData);

        // Xử lý upload ảnh mới (nếu có)
        if ($request->hasFile('images')) {
            $destinationPath = public_path('storage/Motorbikes');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $imagePaths = [];
            foreach ($request->file('images') as $index => $file) {
                $filename = time() . '_' . $index . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                $file->move($destinationPath, $filename);
                $imagePaths[] = 'storage/Motorbikes/' . $filename;
            }

            if (count($imagePaths) > 0) {
                $motorbike->update(['images' => $imagePaths]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công!',
            'data' => $motorbike
        ], 200);
    }
}