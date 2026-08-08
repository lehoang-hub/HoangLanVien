<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BungalowImage extends Model
{
    public $timestamps = false; // Bảng này không có created_at, updated_at

    protected $fillable = [
        'bungalow_id', 'image_url', 'is_primary', 'sort_order'
    ];

    // Bức ảnh này thuộc về 1 Bungalow
    public function bungalow()
    {
        return $this->belongsTo(Bungalow::class);
    }
}