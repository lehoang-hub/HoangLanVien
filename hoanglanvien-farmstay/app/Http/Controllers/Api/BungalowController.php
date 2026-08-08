<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bungalow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Mail\BookingConfirmationMail;
use Illuminate\Support\Facades\Mail;
use App\Models\Booking;

class BungalowController extends Controller
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
            'message' => 'Đặt phòng thành công và đã gửi email xác nhận!',
            'data' => $data
        ], 200);
    }

    public function index()
    {
        $bungalows = DB::table('bungalows')->orderBy('created_at', 'desc')->get();
        return response()->json($bungalows, 200);
    }

    // Xử lý Thêm mới phòng (Hỗ trợ nhận mảng ảnh hoặc ảnh đơn Base64)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required',
            'max_capacity' => 'required|integer',
            'base_price' => 'required|numeric',
            'status' => 'required|string',
            'available_from' => 'nullable|date',
            'available_to' => 'nullable|date',
        ]);

// ... (phần validate phía trên giữ nguyên) ...
        $validated['slug'] = \Str::slug($validated['name']);
        
        $imagePaths = []; // Mảng chứa tất cả đường dẫn ảnh

        if ($request->hasFile('images')) {
            $destinationPath = public_path('storage/bungalows');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            foreach ($request->file('images') as $index => $file) {
                $filename = time() . '_' . $index . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                $file->move($destinationPath, $filename);
                
                $path = 'storage/bungalows/' . $filename;
                $imagePaths[] = $path; // Thêm vào danh sách mảng
            }
        }

        // Nếu có upload ảnh, lưu ảnh đầu tiên làm ảnh đại diện, lưu toàn bộ mảng vào cột 'images'
        $validated['image'] = count($imagePaths) > 0 ? $imagePaths[0] : null;
        $validated['images'] = $imagePaths;

        // ... (phần save capacity và create Bungalow phía dưới giữ nguyên) ...

        if (isset($validated['capacity'])) {
            $validated['capacity'] = (int) filter_var($validated['capacity'], FILTER_SANITIZE_NUMBER_INT);
            if ($validated['capacity'] <= 0) $validated['capacity'] = 2;
        }

        $bungalow = Bungalow::create($validated);

        return response()->json([
            'message' => 'Thêm phòng thành công!',
            'data' => $bungalow
        ], 201);
    }

    public function show($id)
    {
        $bungalow = Bungalow::find($id);
        if (!$bungalow) return response()->json(['message' => 'Không tìm thấy phòng!'], 404);
        return response()->json($bungalow, 200);
    }

    public function update(Request $request, $id)
    {
        return $this->updateWithPost($request, $id);
    }

    public function destroy($id)
    {
        $bungalow = Bungalow::find($id);
        if (!$bungalow) return response()->json(['message' => 'Không tìm thấy phòng!'], 404);
        
        $bungalow->delete();
        return response()->json(['message' => 'Xóa Bungalow thành công!'], 200);
    }

    // Xử lý Cập nhật phòng (Hỗ trợ nhận mảng ảnh Base64 mới, tránh hoàn toàn lỗi 413)
   public function updateWithPost(Request $request, $id)
    {
        $bungalow = Bungalow::findOrFail($id);
        
        // Ép kiểu dữ liệu an toàn để tránh lỗi 500 từ Database
        $updateData = [
            'name' => $request->name,
            'capacity' => $request->capacity,
            'max_capacity' => $request->filled('max_capacity') ? (int)$request->max_capacity : 0,
            'base_price' => $request->filled('base_price') ? (float)$request->base_price : 0,
            'status' => $request->status,
            // Nếu ngày tháng bị rỗng (empty string ""), chuyển thành null để DB không báo lỗi
            'available_from' => $request->filled('available_from') ? $request->available_from : null,
            'available_to' => $request->filled('available_to') ? $request->available_to : null,
        ];

        if ($request->has('daily_status')) {
            $updateData['daily_status'] = $request->daily_status;
        }

        $bungalow->update($updateData);

        // Xử lý upload mảng ảnh mới
        if ($request->hasFile('images')) {
            $destinationPath = public_path('storage/bungalows');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $imagePaths = [];
            foreach ($request->file('images') as $index => $file) {
                $filename = time() . '_' . $index . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                $file->move($destinationPath, $filename);
                
                $imagePaths[] = 'storage/bungalows/' . $filename;
            }

            // Ghi đè ảnh mới
            if (count($imagePaths) > 0) {
                $bungalow->update([
                    'image' => $imagePaths[0],
                    'images' => $imagePaths
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công!',
            'data' => $bungalow
        ], 200);
    }
}