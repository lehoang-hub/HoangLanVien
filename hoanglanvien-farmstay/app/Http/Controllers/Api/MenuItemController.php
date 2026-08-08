<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuItemController extends Controller
{
    // 1. Lấy toàn bộ danh sách (có thể lọc theo 'type' là 'food' hoặc 'drink')
    public function index(Request $request)
    {
        $query = DB::table('menu_items')->orderBy('created_at', 'desc');
        
        // Nếu Frontend truyền thêm ?type=food thì chỉ lấy đồ ăn
        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        return response()->json($query->get(), 200);
    }

    // 2. Thêm mới Món ăn/Thức uống
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric',
            'type' => 'required|in:food,drink',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Validate chỉ cho phép file ảnh tối đa 2MB
            'status' => 'nullable|in:available,out_of_stock'
        ]);

        try {
            // Xử lý upload file ảnh trực tiếp
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                // Lưu vào thư mục public/storage/menu
                $file->move(public_path('storage/menu'), $filename);
                $validated['image'] = 'storage/menu/' . $filename;
            }

            $validated['status'] = $validated['status'] ?? 'available';

            $menuItem = MenuItem::create($validated);

            return response()->json([
                'message' => 'Thêm món thành công!',
                'data' => $menuItem
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi Database: ' . $e->getMessage()], 500);
        }
    }
    // 3. Cập nhật Món ăn/Thức uống
    public function update(Request $request, $id)
    {
        $menuItem = MenuItem::find($id);
        if (!$menuItem) return response()->json(['message' => 'Không tìm thấy món!'], 404);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric',
            'type' => 'sometimes|required|in:food,drink',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'nullable|in:available,out_of_stock'
        ]);

        try {
            $menuItem->update($validated);

            return response()->json([
                'message' => 'Cập nhật thành công!',
                'data' => $menuItem
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi Database: ' . $e->getMessage()], 500);
        }
    }

    // 4. Xóa
    public function destroy($id)
    {
        $menuItem = MenuItem::find($id);
        if (!$menuItem) return response()->json(['message' => 'Không tìm thấy món!'], 404);
        
        $menuItem->delete();
        return response()->json(['message' => 'Xóa thành công!'], 200);
    }
}