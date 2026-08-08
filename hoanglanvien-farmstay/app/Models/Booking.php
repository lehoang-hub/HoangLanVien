<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'booking_code', 
        'customer_id', 
        'check_in_date', 
        'check_out_date', 
        'total_guests', 
        'total_amount', 
        'notes', 
        'status',
        'bungalow_id'
    ];

    // Quan hệ với bảng Customer (Khách hàng)
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Quan hệ với chi tiết đặt phòng (Bungalow đã chọn)
    public function details()
    {
        return $this->hasMany(BookingDetail::class);
    }
}