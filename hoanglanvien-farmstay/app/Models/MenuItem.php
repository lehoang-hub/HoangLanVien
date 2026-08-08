<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MenuItem extends Model
{
    use HasFactory;

    // Khai báo các cột được phép lưu
    protected $fillable = [
        'name', 'slug', 'description', 'price', 'image', 'type', 'category', 'status'
    ];

    // Tự động sinh URL (slug) từ tên món
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($menuItem) {
            if (empty($menuItem->slug)) {
                $menuItem->slug = Str::slug($menuItem->name, '-');
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}