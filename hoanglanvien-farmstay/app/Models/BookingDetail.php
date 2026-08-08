<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingDetail extends Model
{
    public $timestamps = false; // Bảng này không dùng timestamps

    protected $fillable = [
        'booking_id', 'bungalow_id', 'price_at_booking'
    ];

    // Chi tiết này thuộc về 1 đơn đặt phòng
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    // Chi tiết này tương ứng với 1 Bungalow
    public function bungalow()
    {
        return $this->belongsTo(Bungalow::class);
    }
}