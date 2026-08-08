<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bungalow;
use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * LOGIC TÌM PHÒNG TRỐNG
     */
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
        ]);

        $checkIn = $request->check_in_date;
        $checkOut = $request->check_out_date;

        // Lấy các phòng 'available' NGOẠI TRỪ các phòng đã có trong booking trùng lịch
        $availableBungalows = Bungalow::where('status', 'available')
            ->whereDoesntHave('bookingDetails', function ($query) use ($checkIn, $checkOut) {
                $query->whereHas('booking', function ($q) use ($checkIn, $checkOut) {
                    $q->where('status', '!=', 'cancelled')
                      // Công thức toán học tìm thời gian giao nhau
                      ->where('check_in_date', '<', $checkOut)
                      ->where('check_out_date', '>', $checkIn);
                });
            })
            ->with(['images' => function ($query) {
                $query->where('is_primary', true);
            }])->get();

        return response()->json([
            'success' => true,
            'data' => $availableBungalows
        ]);
    }

    /**
     * LOGIC TẠO ĐƠN ĐẶT PHÒNG
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after_or_equal:check_in_date',
            'total_guests' => 'required|integer',
            'bungalow_id' => 'required|integer|exists:bungalows,id',
            'notes' => 'nullable|string',
        ]);

        // 1. Lưu khách hàng mới (Cách an toàn không sợ lỗi Model)
        $customer = \Illuminate\Support\Facades\DB::table('customers')
            ->where('phone', $request->phone)
            ->first();

        if ($customer) {
            $customerId = $customer->id;
        } else {
            $customerId = \Illuminate\Support\Facades\DB::table('customers')->insertGetId([
                'full_name' => $request->full_name,
                'phone' => $request->phone,
                'email' => $request->email,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Tính tiền
        $bungalow = \App\Models\Bungalow::find($request->bungalow_id);
        $checkIn = \Carbon\Carbon::parse($request->check_in_date);
        $checkOut = \Carbon\Carbon::parse($request->check_out_date);
        $days = $checkIn->diffInDays($checkOut) + 1; 
        
        $totalAmount = $bungalow->base_price * $days;
        $bookingCode = 'HH-FSTAY' . date('Ymd') . '-' . strtoupper(\Str::random(4));

        // 3. Đẩy thẳng đơn đặt phòng vào Database
        \Illuminate\Support\Facades\DB::table('bookings')->insert([
            'booking_code' => $bookingCode,
            'customer_id' => $customerId,
            'bungalow_id' => $request->bungalow_id, 
            'check_in_date' => $request->check_in_date,
            'check_out_date' => $request->check_out_date,
            'total_guests' => $request->total_guests,
            'total_amount' => $totalAmount,
            'notes' => $request->notes,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. (Tùy chọn) Đánh dấu lịch trong Bungalow thành màu Xám (Đã đặt)
        $dailyStatus = $bungalow->daily_status ? json_decode($bungalow->daily_status, true) : [];
        $currentDate = $checkIn->copy();
        
        while ($currentDate->lte($checkOut)) {
            $dateString = $currentDate->format('Y-m-d');
            $dailyStatus[$dateString] = 'booked';
            $currentDate->addDay();
        }
        $bungalow->daily_status = json_encode($dailyStatus);
        $bungalow->save();

        // 5. Trả mã QR về cho khách
        return response()->json([
            'success' => true,
            'message' => 'Đặt phòng thành công!',
            'booking_code' => $bookingCode
        ], 200);
    }
   
public function getBookings()
{
    $bookings = Booking::orderBy('created_at', 'desc')->get();
    return response()->json($bookings, 200);
}
public function index()
    {
        // Join bảng bookings với customers VÀ bungalows
        $bookings = \Illuminate\Support\Facades\DB::table('bookings')
            ->leftJoin('customers', 'bookings.customer_id', '=', 'customers.id')
            ->leftJoin('bungalows', 'bookings.bungalow_id', '=', 'bungalows.id') // Lấy thêm thông tin phòng
            ->select(
                'bookings.*', 
                'customers.full_name', 
                'customers.phone', 
                'customers.email',
                'bungalows.name as bungalow_name' // Trích xuất tên phòng ra
            )
            ->orderBy('bookings.created_at', 'desc')
            ->get();

        return response()->json($bookings, 200);
    }

    // Cập nhật trạng thái của đơn đặt phòng
    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::find($id);
        
        if (!$booking) {
            return response()->json(['message' => 'Không tìm thấy đơn đặt phòng!'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:pending,paid,checked_in,checked_out,cancelled'
        ]);

        $oldStatus = $booking->status;
        $newStatus = $request->status;

        $booking->status = $newStatus;
        $booking->save();

        // Lấy ID phòng trực tiếp từ bảng bookings
        $bungalowId = $booking->bungalow_id;

        // =======================================================
        // 1. KHI KHÁCH CHECK-IN (Đổi sang màu Xanh lá - occupied)
        // =======================================================
        if ($newStatus === 'checked_in' && $oldStatus !== 'checked_in' && $bungalowId) {
            $bungalow = Bungalow::find($bungalowId);
            if ($bungalow) {
                $dailyStatus = $bungalow->daily_status ? json_decode($bungalow->daily_status, true) : [];
                
                $currentDate = Carbon::parse($booking->check_in_date)->startOfDay();
                $endDate = Carbon::parse($booking->check_out_date)->startOfDay();
                
                while ($currentDate->lte($endDate)) {
                    $dateString = $currentDate->format('Y-m-d');
                    $dailyStatus[$dateString] = 'occupied'; // Đánh dấu đang ở (Xanh lá)
                    $currentDate->addDay();
                }
                
                $bungalow->daily_status = json_encode($dailyStatus);
                $bungalow->save();
            }
        }

        // =======================================================
        // 2. KHI KHÁCH CHECK-OUT (Đổi sang màu Vàng - available)
        // =======================================================
        if ($newStatus === 'checked_out' && $oldStatus !== 'checked_out' && $bungalowId) {
            $today = Carbon::now()->startOfDay(); 
            $checkOutDate = Carbon::parse($booking->check_out_date)->startOfDay();

            if ($today->lt($checkOutDate)) {
                $bungalow = Bungalow::find($bungalowId);
                if ($bungalow) {
                    $dailyStatus = $bungalow->daily_status ? json_decode($bungalow->daily_status, true) : [];

                    $currentDate = $today->copy();
                    while ($currentDate->lte($checkOutDate)) {
                        $dateString = $currentDate->format('Y-m-d');
                        if (isset($dailyStatus[$dateString]) && in_array($dailyStatus[$dateString], ['booked', 'occupied'])) {
                            $dailyStatus[$dateString] = 'available'; // Trả lại ngày trống (Vàng)
                        }
                        $currentDate->addDay();
                    }

                    $bungalow->daily_status = json_encode($dailyStatus);
                    $bungalow->save();
                }
            }
        }

        // =======================================================
        // 3. KHI HỦY ĐƠN (Trả lại ngày trống toàn bộ)
        // =======================================================
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled' && $bungalowId) {
            $bungalow = Bungalow::find($bungalowId);
            if ($bungalow) {
                $dailyStatus = $bungalow->daily_status ? json_decode($bungalow->daily_status, true) : [];
                
                $currentDate = Carbon::parse($booking->check_in_date)->startOfDay();
                $endDate = Carbon::parse($booking->check_out_date)->startOfDay();
                
                while ($currentDate->lte($endDate)) {
                    $dateString = $currentDate->format('Y-m-d');
                    if (isset($dailyStatus[$dateString]) && in_array($dailyStatus[$dateString], ['booked', 'occupied'])) {
                        $dailyStatus[$dateString] = 'available';
                    }
                    $currentDate->addDay();
                }
                $bungalow->daily_status = json_encode($dailyStatus);
                $bungalow->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công!',
            'data' => $booking
        ], 200);
    }
    
}
