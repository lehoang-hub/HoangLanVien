<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bungalow;
use App\Models\MotorbikeBooking;
use App\Models\BookingDetail;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Motorbike; 

class MotorbikeBookingController extends Controller
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

        // Lấy các xe máy 'available' NGOẠI TRỪ các xe đã có trong booking trùng lịch
        $availableMotorbikes = Motorbike::where('status', 'available')
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
            'data' => $availableMotorbikes
        ]);
    }

    /**
     * LOGIC TẠO ĐƠN ĐẶT PHÒNG
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            // 👉 BẮT BUỘC PHẢI CÓ 2 DÒNG NÀY Ở ĐẦU ĐỂ KHÔNG BỊ LỖI DÒNG 99
            $start = Carbon::parse($request->check_in_date);
            $end = Carbon::parse($request->check_out_date);

            // 1. Tìm hoặc tạo Khách hàng
            $customer = Customer::firstOrCreate(
                ['email' => $request->email],
                [
                    'full_name' => $request->full_name,
                    'phone' => $request->phone,
                ]
            );

            // 2. Tạo mã Booking ngẫu nhiên
            $bookingCode = 'MotoBike-' . strtoupper(Str::random(5));

            // 3. Tính toán tổng tiền
            $motorbike = Motorbike::findOrFail($request->motorbike_id);
            $days = $start->diffInDays($end) + 1; // Sử dụng biến $start an toàn
            $totalAmount = $days * $motorbike->base_price;

            // 4. Lưu đơn đặt xe vào Database
            $booking = MotorbikeBooking::create([
                'booking_code' => $bookingCode,
                'customer_id' => $customer->id,
                'motorbike_id' => $request->motorbike_id,
                'check_in_date' => $request->check_in_date,
                'check_out_date' => $request->check_out_date,
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
                'status' => 'pending'
            ]);

            // 5. Cập nhật lịch xe (daily_status) thành 'booked'
            $dailyStatus = is_array($motorbike->daily_status) ? $motorbike->daily_status : []; 
            
            // Lúc này biến $start đã tồn tại nên dòng lệnh này (tương đương dòng 99 của bạn) sẽ chạy mượt mà
            $curr = $start->copy();
            while ($curr <= $end) {
                $dateStr = $curr->format('Y-m-d');
                $dailyStatus[$dateStr] = 'booked';
                $curr->addDay();
            }
            
            $motorbike->update(['daily_status' => $dailyStatus]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đặt xe thành công!',
                'booking_code' => $bookingCode,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
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
            ->leftJoin('motorbikes', 'bookings.motorbike_id', '=', 'motorbikes.id') // Lấy thêm thông tin xe máy
            ->select(
                'bookings.*', 
                'customers.full_name', 
                'customers.phone', 
                'customers.email',
                'motorbikes.name as motorbike_name' // Trích xuất tên xe máy ra
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
            return response()->json(['message' => 'Không tìm thấy đơn đặt xe!'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:pending,paid,checked_in,checked_out,cancelled'
        ]);

        $oldStatus = $booking->status;
        $newStatus = $request->status;

        $booking->status = $newStatus;
        $booking->save();

        // Lấy ID xe máy trực tiếp từ bảng bookings
        $motorbikeId = $booking->motorbike_id;

        // =======================================================
        // 1. KHI KHÁCH CHECK-IN (Đổi sang màu Xanh lá - occupied)
        // =======================================================
        if ($newStatus === 'checked_in' && $oldStatus !== 'checked_in' && $motorbikeId) {
            $motorbike = Motorbike::find($motorbikeId);
            if ($motorbike) {
                $dailyStatus = $motorbike->daily_status ? json_decode($motorbike->daily_status, true) : [];
                
                $currentDate = Carbon::parse($booking->check_in_date)->startOfDay();
                $endDate = Carbon::parse($booking->check_out_date)->startOfDay();
                
                while ($currentDate->lte($endDate)) {
                    $dateString = $currentDate->format('Y-m-d');
                    $dailyStatus[$dateString] = 'occupied'; // Đánh dấu đang ở (Xanh lá)
                    $currentDate->addDay();
                }
                
                $motorbike->daily_status = json_encode($dailyStatus);
                $motorbike->save();
            }
        }

        // =======================================================
        // 2. KHI KHÁCH CHECK-OUT (Đổi sang màu Vàng - available)
        // =======================================================
        if ($newStatus === 'checked_out' && $oldStatus !== 'checked_out' && $motorbikeId) {
            $today = Carbon::now()->startOfDay(); 
            $checkOutDate = Carbon::parse($booking->check_out_date)->startOfDay();

            if ($today->lt($checkOutDate)) {
                $motorbike = Motorbike::find($motorbikeId);
                if ($motorbike) {
                    $dailyStatus = $motorbike->daily_status ? json_decode($motorbike->daily_status, true) : [];

                    $currentDate = $today->copy();
                    while ($currentDate->lte($checkOutDate)) {
                        $dateString = $currentDate->format('Y-m-d');
                        if (isset($dailyStatus[$dateString]) && in_array($dailyStatus[$dateString], ['booked', 'occupied'])) {
                            $dailyStatus[$dateString] = 'available'; // Trả lại ngày trống (Vàng)
                        }
                        $currentDate->addDay();
                    }

                    $motorbike->daily_status = json_encode($dailyStatus);
                    $motorbike->save();
                }
            }
        }

        // =======================================================
        // 3. KHI HỦY ĐƠN (Trả lại ngày trống toàn bộ)
        // =======================================================
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled' && $motorbikeId) {
            $motorbike = Motorbike::find($motorbikeId);
            if ($motorbike) {
                $dailyStatus = $motorbike->daily_status ? json_decode($motorbike->daily_status, true) : [];
                
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
