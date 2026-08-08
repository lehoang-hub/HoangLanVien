<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Motorbike extends Model
{
    use HasFactory;

    // Các trường được phép lưu vào CSDL
    protected $fillable = [
        'name',
        'license_plate',
        'base_price',
        'description',
        'images',
        'daily_status',
    ];

    // Tự động chuyển đổi mảng (JSON) khi lưu/đọc từ Database
    protected $casts = [
        'images' => 'array',
        'daily_status' => 'array',
    ];
}