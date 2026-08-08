<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    // Lấy danh sách (Lọc theo type=image hoặc type=video)
   public function index(Request $request)
    {
        try {
            $query = Gallery::query();

            if ($request->has('type')) {
                $query->where('type', $request->query('type'));
            }

            $galleries = $query->orderBy('created_at', 'desc')->get();

            return response()->json($galleries, 200);
        } catch (\Exception $e) {
            // TRẢ VẺ THÔNG BÁO LỖI THẬT CỦA PHP ĐỂ HIỂN THỊ LÊN MÀN HÌNH
            return response()->json([
                'message' => 'Lỗi chi tiết: ' . $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    // Thêm mới Ảnh hoặc Video
    public function store(Request $request)
    {
        try {
            $type = $request->input('type');
            $title = $request->input('title');
            $videoUrl = $request->input('video_url');
            $filePath = null;

            // Nếu là ảnh và có đính kèm file
            if ($type === 'image' && $request->hasFile('file_path')) {
                $file = $request->file('file_path');
                $filename = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                
                $destinationPath = public_path('storage/gallery');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }

                $file->move($destinationPath, $filename);
                $filePath = 'storage/gallery/' . $filename;
            }

            // Tạo bản ghi trong Database
            $gallery = Gallery::create([
                'type' => $type,
                'title' => $title,
                'file_path' => $filePath,
                'video_url' => $videoUrl
            ]);

            return response()->json([
                'message' => 'Thêm mới thành công!',
                'data' => $gallery
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi Server: ' . $e->getMessage()], 500);
        }
    }

    // Xóa ảnh hoặc video
    public function destroy($id)
    {
        try {
            $item = Gallery::find($id);
            if (!$item) {
                return response()->json(['message' => 'Không tìm thấy!'], 404);
            }

            // Xóa file vật lý trên ổ cứng nếu có
            if ($item->file_path && file_exists(public_path($item->file_path))) {
                @unlink(public_path($item->file_path));
            }

            $item->delete();
            return response()->json(['message' => 'Xóa thành công!'], 200);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi Server: ' . $e->getMessage()], 500);
        }
    }
}