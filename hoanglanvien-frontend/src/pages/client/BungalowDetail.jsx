import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BungalowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bungalow, setBungalow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);
  
  const [customerForm, setCustomerForm] = useState({
    fullname: '',
    phone: '',
    email: ''
  });

  // State mới để quản lý luồng thanh toán
  const [bookingResult, setBookingResult] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/admin/bungalows/${id}`)
      .then(res => res.json())
      .then(data => {
        setBungalow(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-10 text-center">Đang tải chi tiết phòng...</div>;
  if (!bungalow) return <div className="p-10 text-center text-red-500">Không tìm thấy phòng!</div>;

  // Xử lý danh sách ảnh an toàn chống sập web
  let parsedImages = [];
  if (bungalow.images) {
    if (typeof bungalow.images === 'string') {
      try {
        parsedImages = JSON.parse(bungalow.images);
      } catch (error) {
        parsedImages = [];
      }
    } else if (Array.isArray(bungalow.images)) {
      parsedImages = bungalow.images; 
    }
  }

  const imageList = parsedImages.length > 0 
    ? parsedImages.map(img => img.url || img) 
    : (bungalow.image ? [bungalow.image] : []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? imageList.length - 1 : prevIndex - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === imageList.length - 1 ? 0 : prevIndex + 1));
  };

  const dailyMap = bungalow.daily_status ? JSON.parse(bungalow.daily_status) : {};
  const startDateStr = bungalow.available_from ? bungalow.available_from.split('T')[0] : null;
  const endDateStr = bungalow.available_to ? bungalow.available_to.split('T')[0] : null;

  const handleDateClick = (dateStr, status, isDisabled) => {
    if (isDisabled || status !== 'available') {
      alert("Ngày này không khả dụng hoặc đang bận!");
      return;
    }

    if (selectedDates.length === 0 || selectedDates.length === 2) {
      setSelectedDates([dateStr]);
    } else if (selectedDates.length === 1) {
      const firstDate = selectedDates[0];
      
      if (dateStr < firstDate) {
        setSelectedDates([dateStr]);
        return;
      }

      let curr = new Date(firstDate);
      const end = new Date(dateStr);
      
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        const s = dailyMap[dStr] || 'available';
        
        if (s !== 'available' && s !== 'Trống') {
          alert(`Khoảng thời gian bạn chọn chứa ngày ${dStr} không trống! Vui lòng chọn lại.`);
          setSelectedDates([dateStr]);
          return;
        }
        curr.setDate(curr.getDate() + 1);
      }

      setSelectedDates([firstDate, dateStr]);
    }
  };

  const calculateBookingDetails = () => {
    // Nếu chưa chọn ngày nào
    if (selectedDates.length === 0) return { totalDays: 0, totalPrice: 0 };
    
    // Nếu chỉ chọn đúng 1 ngày
    if (selectedDates.length === 1) {
      return { totalDays: 1, totalPrice: Number(bungalow.base_price) };
    }
    
    // Nếu chọn nhiều ngày (khoảng thời gian)
    const start = new Date(selectedDates[0]);
    const end = new Date(selectedDates[1]);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = totalDays * Number(bungalow.base_price);
    return { totalDays, totalPrice };
  };

  const { totalDays, totalPrice } = calculateBookingDetails();

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    
    // ĐIỂM QUAN TRỌNG: Chỉ báo lỗi khi mảng ngày trống (chưa chọn ngày nào)
    if (selectedDates.length === 0) {
      alert("Vui lòng click chọn ngày trên lịch!");
      return;
    }

    // Xử lý linh hoạt: Chọn 1 ngày (đi về trong ngày) hoặc nhiều ngày
    const checkIn = selectedDates[0];
    const checkOut = selectedDates.length === 2 ? selectedDates[1] : selectedDates[0];

    // Đóng gói dữ liệu
    const bookingData = {
      full_name: customerForm.fullname,
      phone: customerForm.phone,
      email: customerForm.email,
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_guests: Number(bungalow.capacity) || 1,
      bungalow_id: bungalow.id, // Đã cập nhật ID chính xác
      notes: "Khách đặt từ trang chi tiết Bungalow"
    };

    // Gửi dữ liệu lên Server
    fetch('http://localhost:8000/api/client/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bookingData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Chuyển sang màn hình QR Thanh toán
        setBookingResult({
          bookingCode: data.booking_code,
          bungalowName: bungalow.name,
          totalPrice: totalPrice, // totalPrice lấy từ hàm calculateBookingDetails
          customerName: customerForm.fullname
        });
      } else {
        alert("Lỗi: " + (data.message || "Không thể đặt phòng"));
      }
    })
    .catch(err => {
      console.error("Lỗi kết nối:", err);
      alert("Có lỗi xảy ra khi kết nối tới máy chủ!");
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDaysInMonth = new Date(2026, 7 + 1, 0).getDate();

    // 1. Tạo mốc so sánh "Ngày hôm nay" chuẩn định dạng YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const currentDate = `2026-08-${dayStr}`;

      let bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      let statusText = 'Trống';
      let isDisabled = false;

      // 2. KHÓA CÁC NGÀY TRONG QUÁ KHỨ
      if (currentDate < todayStr) {
        bgClass = 'bg-gray-100 text-gray-400 border-gray-200';
        statusText = 'Đã qua';
        isDisabled = true;
      } 
      // 3. Khóa ngày ngoài phạm vi kinh doanh (available_from / to)
      else if (startDateStr && endDateStr && (currentDate < startDateStr || currentDate > endDateStr)) {
        bgClass = 'bg-gray-100 text-gray-300 border-gray-200 line-through';
        statusText = 'Không mở';
        isDisabled = true;
      } 
      // 4. Quét trạng thái Booking (Đổi màu Xanh/Vàng/Đỏ)
      else {
        const status = dailyMap[currentDate] || 'available';
        if (status === 'booked') { 
            bgClass = 'bg-gray-200 text-gray-700'; 
            statusText = 'Đã đặt'; 
            isDisabled = true; 
        } else if (status === 'occupied') { 
            bgClass = 'bg-green-100 text-green-800 border-green-500 shadow-sm'; 
            statusText = 'Đang ở'; 
            isDisabled = true; 
        } else if (status === 'maintenance') { 
            bgClass = 'bg-red-100 text-red-800 border-red-500'; 
            statusText = 'Bảo trì'; 
            isDisabled = true; 
        }
      }

      // Xử lý Highlight ngày khách đang click chọn
      const isSelected = selectedDates.length > 0 && (currentDate === selectedDates[0] || currentDate === selectedDates[1] || (selectedDates.length === 2 && currentDate > selectedDates[0] && currentDate < selectedDates[1]));
      if (isSelected && !isDisabled) {
        bgClass = 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';
      }

      days.push(
        <div 
          key={currentDate} 
          onClick={() => handleDateClick(currentDate, dailyMap[currentDate] || 'available', isDisabled)}
          className={`p-4 border rounded-xl text-center font-semibold transition cursor-pointer ${bgClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <div className="text-lg font-bold">{i}</div>
          <div className="text-xs mt-1 uppercase">{statusText}</div>
        </div>
      );
    }
    return days;
  };

  // ==========================================
  // GIAO DIỆN THANH TOÁN (HIỂN THỊ KHI ĐẶT PHÒNG THÀNH CÔNG)
  // ==========================================
  if (bookingResult) {
    // TÙY CHỈNH THÔNG TIN NGÂN HÀNG CỦA BẠN TẠI ĐÂY
    const bankId = "VCB"; // Mã ngân hàng (VCB, MB, TCB, ACB, v.v...)
    const accountNo = "1001000280804"; // Số tài khoản của bạn
    const accountName = "HOANG NGOC LE"; // Tên chủ tài khoản
    
    // Tạo nội dung chuyển khoản: "Mã đặt phòng - Tên phòng"
    const transferContent = `${bookingResult.bookingCode} - ${bookingResult.bungalowName}`;
    
    // URL API tạo ảnh QR động của VietQR (Tự động điền tiền và nội dung)
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${bookingResult.totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10 text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Đặt phòng thành công!</h2>
        
        <div className="bg-gray-50 border rounded-xl p-6 mb-8 max-w-lg mx-auto text-left shadow-sm">
          <p className="text-gray-700 mb-2">Xin chào <strong>{bookingResult.customerName}</strong>,</p>
          <p className="text-gray-700 mb-2">Mã đặt phòng của bạn là: <strong className="text-blue-600 text-lg">{bookingResult.bookingCode}</strong></p>
          <p className="text-gray-700 mb-2">Phòng đã đặt: <strong>{bookingResult.bungalowName}</strong></p>
          <p className="text-gray-700 mb-2">Tổng số tiền: <strong className="text-red-600 text-lg">{bookingResult.totalPrice.toLocaleString()} VNĐ</strong></p>
        </div>

        {!showQR ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="bg-yellow-100 border border-yellow-300 px-6 py-4 rounded-lg mb-6 max-w-lg">
                <p className="font-semibold text-yellow-800 text-lg">Quý khách xác nhận thông tin đặt phòng đã chính xác?</p>
                <p className="text-sm text-yellow-700 mt-1">Vui lòng tiến hành thanh toán để hoàn tất quá trình giữ phòng.</p>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => navigate(0)} className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition font-semibold text-gray-700">
                Sửa thông tin
              </button>
              <button onClick={() => setShowQR(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center gap-2">
                💳 Thanh toán ngay
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 p-8 border-2 border-blue-100 rounded-2xl bg-blue-50 flex flex-col items-center animate-fade-in">
            <h3 className="font-bold text-2xl mb-2 text-blue-900">Quét mã QR để thanh toán</h3>
            <p className="text-gray-600 mb-6">Sử dụng App ngân hàng bất kỳ để quét mã. Nội dung và số tiền đã được điền tự động.</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-md border inline-block mb-6">
              <img src={qrUrl} alt="Mã QR Thanh Toán" className="w-72 h-72 object-contain" />
            </div>

            <div className="text-left bg-white p-6 rounded-xl border shadow-sm w-full max-w-md space-y-3 text-gray-800">
                <p>Ngân hàng: <strong>Vietcombank (VCB)</strong></p>
                <p>Số tài khoản: <strong>{accountNo}</strong></p>
                <p>Chủ tài khoản: <strong>{accountName}</strong></p>
                <p>Số tiền: <strong className="text-red-600 text-xl">{bookingResult.totalPrice.toLocaleString()} đ</strong></p>
                <p>Nội dung chuyển khoản: <strong className="bg-gray-100 px-2 py-1 rounded">{transferContent}</strong></p>
            </div>

            <button onClick={() => navigate(0)} className="mt-8 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow transition">
              Hoàn tất & Về trang chủ
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN MẶC ĐỊNH (XEM VÀ ĐẶT PHÒNG)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 text-left">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600 hover:underline">&larr; Quay lại</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          {imageList.length > 0 ? (
            <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md border bg-black">
              <img 
                src={`http://localhost:8000/${imageList[currentImageIndex]}`} 
                alt={bungalow.name} 
                className="w-full h-full object-cover transition-all duration-300" 
              />
              
              {imageList.length > 1 && (
                <button 
                  onClick={handlePrevImage} 
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition shadow"
                >
                  &#10094;
                </button>
              )}

              {imageList.length > 1 && (
                <button 
                  onClick={handleNextImage} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition shadow"
                >
                  &#10095;
                </button>
              )}

              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {imageList.length}
              </div>
            </div>
          ) : (
            <div className="w-full h-80 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 italic">Chưa có ảnh</div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bungalow.name}</h1>
            <p className="text-gray-500 mt-1">Sức chứa: {bungalow.capacity} người (Tối đa: {bungalow.max_capacity})</p>
            <div className="mt-4">
              <span className="text-2xl font-bold text-red-600">{Number(bungalow.base_price).toLocaleString()} đ</span>
              <span className="text-gray-500 text-sm"> / đêm</span>
            </div>
            <p className="text-gray-600 mt-4">{bungalow.description || "Không gian thoáng mát, view đẹp, thích hợp nghỉ dưỡng trọn vẹn tại FarmStay."}</p>
          </div>

          <form onSubmit={handleBookingSubmit} className="mt-6 bg-gray-50 p-4 rounded-xl border space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin đặt phòng</h3>
            <div className="text-xs text-blue-600 font-semibold">
              {selectedDates.length > 0 
                ? `Đã chọn: ${selectedDates.length === 1 ? selectedDates[0] : `Từ ${selectedDates[0]} đến ${selectedDates[1]}`} (${totalDays} ngày)` 
                : '👉 Vui lòng click chọn ngày trên lịch bên dưới'}
            </div>
            
            <input type="text" placeholder="Họ và tên *" value={customerForm.fullname} onChange={e => setCustomerForm({...customerForm, fullname: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="tel" placeholder="Số điện thoại *" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="email" placeholder="Email nhận thông tin xác nhận *" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full border p-2 rounded text-sm" required />

            {/* Cho phép hiển thị Tổng tiền ngay cả khi chỉ chọn 1 ngày */}
            {selectedDates.length > 0 && (
              <div className="text-sm font-bold text-red-600 pt-1">
                Tổng tiền tạm tính: {totalPrice.toLocaleString()} đ
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow transition">
              📅 Xác nhận đặt phòng ngay
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn lịch trống tháng 08/2026 (Click chọn ngày)</h2>
        <div className="grid grid-cols-7 gap-3">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}