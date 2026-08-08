<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str; // Import thư viện xử lý chuỗi của Laravel
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Bungalow extends Model
{
    use HasFactory;

    // Bắt buộc phải có dòng này để Laravel cho phép lưu dữ liệu hàng loạt (bao gồm cả price)
    protected $fillable = [
        'name', 'slug', 'description', 'capacity', 'max_capacity', 'base_price', 'status','available_from', 'available_to', 'status', 'image', 'daily_status','images'
    ];

    /**
     * 1. TỐI ƯU SEO: Can thiệp vào vòng đời (boot) của Model
     * Tự động sinh ra URL chuẩn SEO (slug) từ trường 'name' trước khi lưu vào Database
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($bungalow) {
            // Nếu người dùng không nhập slug, hệ thống tự động tạo từ tên
            if (empty($bungalow->slug)) {
                $bungalow->slug = Str::slug($bungalow->name, '-');
            }
        });
    }

    /**
     * 2. TỐI ƯU SEO: Route Model Binding
     * Báo cho hệ thống Routing của Laravel sử dụng cột 'slug' thay vì 'id' trên thanh địa chỉ URL.
     * Ví dụ: get('/bungalows/{bungalow}') -> tự động query theo slug.
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }

    // --- CÁC MỐI QUAN HỆ CƠ SỞ DỮ LIỆU ---

    public function images()
    {
        return $this->hasMany(BungalowImage::class);
    }

    public function bookingDetails()
    {
        return $this->hasMany(BookingDetail::class);
    }
}