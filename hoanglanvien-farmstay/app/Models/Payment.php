<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'booking_id', 'amount', 'payment_method', 'payment_status', 'transaction_id', 'paid_at'
    ];

    // Giao dịch thanh toán này thuộc về 1 đơn đặt phòng
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}