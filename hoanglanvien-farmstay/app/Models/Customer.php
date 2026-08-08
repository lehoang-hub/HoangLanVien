<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'full_name', 'phone', 'email'
    ];

    // Một khách hàng có thể có nhiều đơn đặt phòng
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}