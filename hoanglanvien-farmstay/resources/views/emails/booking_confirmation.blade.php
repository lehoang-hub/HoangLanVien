<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Xác nhận đặt phòng</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Cảm ơn quý khách đã đặt phòng tại Hoàng Lan Viên FarmStay!</h2>
    <p>Thông tin chi tiết đơn đặt phòng của bạn:</p>
    <ul>
        <li><strong>Họ và tên:</strong> {{ $bookingData['fullname'] }}</li>
        <li><strong>Số điện thoại:</strong> {{ $bookingData['phone'] }}</li>
        <li><strong>Email:</strong> {{ $bookingData['email'] }}</li>
        <li><strong>Tên phòng:</strong> {{ $bookingData['bungalow_name'] }}</li>
        <li><strong>Ngày đặt:</strong> Từ ngày {{ $bookingData['from_date'] }} đến ngày {{ $bookingData['to_date'] }}</li>
        <li><strong>Tổng số ngày:</strong> {{ $bookingData['total_days'] }} ngày</li>
        <li><strong>Giờ Check-in:</strong> 14h00</li>
        <li><strong>Giờ Check-out:</strong> 12h00</li>
        <li><strong>Tổng số tiền:</strong> {{ number_format($bookingData['total_price']) }} đ</li>
        <li><strong>Ngày giờ thực hiện:</strong> {{ $bookingData['created_at'] }}</li>
    </ul>
    <p>Trân trọng,<br><strong>Hoàng Lan Viên FarmStay</strong></p>
</body>
</html>