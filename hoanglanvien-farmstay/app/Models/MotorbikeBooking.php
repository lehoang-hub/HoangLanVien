<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotorbikeBooking extends Model
{
    use HasFactory;

    // Chỉ định rõ tên bảng trong Database (đề phòng Laravel tự động thêm 's' bị sai)
    protected $table = 'motorbike_bookings';

    // Các trường dữ liệu được phép lưu (Mass Assignment)
    protected $fillable = [
        'booking_code',
        'customer_id',
        'motorbike_id',
        'check_in_date',
        'check_out_date',
        'total_amount',
        'notes',
        'status'
    ];

    /**
     * Khai báo mối quan hệ với bảng Khách hàng
     * Giúp bạn dễ dàng lấy tên khách từ đơn đặt xe: $booking->customer->full_name
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Khai báo mối quan hệ với bảng Xe máy
     * Giúp bạn dễ dàng lấy biển số xe từ đơn: $booking->motorbike->license_plate
     */
    public function motorbike()
    {
        return $this->belongsTo(Motorbike::class, 'motorbike_id');
    }
}