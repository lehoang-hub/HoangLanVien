import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MotorbikeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motorbike, setMotorbike] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dynamicDailyMap, setDynamicDailyMap] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);

  // 👉 ĐÃ THÊM: Biến roomName vào Form
  const [customerForm, setCustomerForm] = useState({ fullname: '', phone: '', email: '', roomName: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [showQR, setShowQR] = useState(false);

useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/${id}/`)
      .then(res => res.json())
      .then(data => {
        // 👉 CẢI TIẾN 1: Bóc tách lớp vỏ bọc 'data' hoặc 'result' nếu Django có lỡ bọc vào
        const actualData = data.data || data.result || data;
        setMotorbike(actualData);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });

    const fetchBookingsForCalendar = async () => {
      // ... (Phần code bên trong fetchBookingsForCalendar giữ nguyên)
      try {
        let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/motorbike-bookings/`);
        if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/client/motorbike-bookings/`);
        if (!res.ok) return;

        const data = await res.json();
        const allBookings = Array.isArray(data) ? data : (data.results || data.data || []);

        const activeBookings = allBookings.filter(
          b => (String(b.motorbike) === String(id) || String(b.motorbike_id) === String(id)) && b.status !== 'cancelled'
        );

        const newMap = {};
        activeBookings.forEach(b => {
           let dayStatus = 'booked';
           if (b.status === 'checked_in' || b.status === 'paid') dayStatus = 'occupied';
           if (b.status === 'maintenance') dayStatus = 'maintenance';

           if (b.check_in_date && b.check_out_date) {
             let curr = new Date(b.check_in_date);
             const end = new Date(b.check_out_date);
             while (curr <= end) {
               const dStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
               if (newMap[dStr] !== 'occupied') newMap[dStr] = dayStatus;
               curr.setDate(curr.getDate() + 1);
             }
           }
        });
        setDynamicDailyMap(newMap);
      } catch (e) {
        console.error("Lỗi đồng bộ lịch:", e);
      }
    };
    fetchBookingsForCalendar();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Đang tải chi tiết xe...</div>;
  if (!motorbike) return <div className="p-10 text-center text-red-500">Không tìm thấy xe!</div>;

  // 👉 CẢI TIẾN 2: Lưới quét thông minh tìm Mảng Ảnh (Galleries)
  let parsedImages = [];
  const rawImages = motorbike.images || motorbike.gallery || motorbike.galleries;
  if (rawImages) {
    if (typeof rawImages === 'string') {
      try { parsedImages = JSON.parse(rawImages); } catch (e) { parsedImages = []; }
    } else if (Array.isArray(rawImages)) {
      parsedImages = rawImages;
    }
  }

  // 👉 CẢI TIẾN 3: Lưới quét thông minh tìm Ảnh chính (Bao phủ mọi tên biến)
  const mainImage = motorbike.image || motorbike.image_url || motorbike.thumbnail || motorbike.photo || motorbike.picture;

  const imageList = parsedImages.length > 0
    ? parsedImages.map(img => img.url || img.image || img)
    : (mainImage ? [mainImage] : []);

  const handlePrevImage = () => setCurrentImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  const handleNextImage = () => setCurrentImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));

  let baseMap = {};
  try {
    baseMap = typeof motorbike.daily_status === 'string' ? JSON.parse(motorbike.daily_status) : (motorbike.daily_status || {});
  } catch (e) {
    baseMap = {};
  }

  const dailyMap = { ...baseMap, ...dynamicDailyMap };

  const handleDateClick = (dateStr, status, isDisabled) => {
    if (isDisabled || status !== 'available') { alert("Ngày này không khả dụng hoặc đang bận!"); return; }
    if (selectedDates.length === 0 || selectedDates.length === 2) { setSelectedDates([dateStr]); }
    else if (selectedDates.length === 1) {
      const firstDate = selectedDates[0];
      if (dateStr < firstDate) { setSelectedDates([dateStr]); return; }
      let curr = new Date(firstDate); const end = new Date(dateStr);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        const s = dailyMap[dStr] || 'available';
        if (s !== 'available' && s !== 'Trống') {
          alert(`Khoảng thời gian bạn chọn chứa ngày ${dStr} không trống! Vui lòng chọn lại.`);
          setSelectedDates([dateStr]); return;
        }
        curr.setDate(curr.getDate() + 1);
      }
      setSelectedDates([firstDate, dateStr]);
    }
  };

  const calculateBookingDetails = () => {
    if (selectedDates.length === 0) return { totalDays: 0, totalPrice: 0 };
    if (selectedDates.length === 1) return { totalDays: 1, totalPrice: Number(motorbike.base_price) };
    const start = new Date(selectedDates[0]); const end = new Date(selectedDates[1]);
    const totalDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    return { totalDays, totalPrice: totalDays * Number(motorbike.base_price) };
  };

  const { totalDays, totalPrice } = calculateBookingDetails();

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem('userToken');
    if (!token) {
      alert("Vui lòng đăng nhập tài khoản để tiếp tục đặt dịch vụ!");
      navigate('/auth', { state: { isLogin: true } });
      return;
    }

    if (selectedDates.length === 0) { alert("Vui lòng click chọn ngày thuê trên lịch!"); return; }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const random2Digits = Math.floor(Math.random() * 90) + 10;

    const cleanMotorbikeName = (motorbike?.name || 'MOTO')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const customBookingCode = `MX${cleanMotorbikeName}${dd}${mm}${yyyy}${hh}${mins}${random2Digits}`;

    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const userId = userData.id || null;

    const bookingData = {
      booking_code: customBookingCode,

      // Tập trung gửi chuẩn Tên và SĐT
      full_name: customerForm.fullname,
      customer_name: customerForm.fullname,
      phone: customerForm.phone,
      customer_phone: customerForm.phone,
      email: customerForm.email,

      customer: userId,
      customer_id: userId,
      user: userId,

      check_in_date: selectedDates[0],
      check_out_date: selectedDates.length === 2 ? selectedDates[1] : selectedDates[0],
      motorbike_id: motorbike.id,
      motorbike: motorbike.id,
      status: 'pending',
      total_amount: totalPrice,

      // 👉 ĐÃ THÊM: Gắn Tên Phòng vào Ghi chú để lách luật không cần sửa Backend Model
      notes: customerForm.roomName ? `Khách ở phòng: ${customerForm.roomName}` : "Khách đặt xe vãng lai",
      created_at: now.toISOString()
    };

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbike-bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bookingData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success || data.id || data.booking_code) {
        setBookingResult({ bookingCode: data.booking_code || customBookingCode, itemName: motorbike.name, totalPrice, customerName: customerForm.fullname });
      } else alert("Lỗi: " + (data.message || JSON.stringify(data)));
    }).catch(err => alert("Lỗi kết nối tới máy chủ!"));
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 👉 ĐÃ SỬA: Luôn vẽ đủ 31 ngày của tháng 8/2026 (hoặc tháng hiện tại) thay vì ẩn đi
    const year = 2026;
    const month = 8;
    const totalDaysInMonth = new Date(year, month, 0).getDate(); // Lấy tổng số ngày trong tháng

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const currentDate = `${year}-08-${dayStr}`;

      let bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      let statusText = 'Trống';
      let isDisabled = false;

      if (currentDate < todayStr) {
        bgClass = 'bg-gray-100 text-gray-400 border-gray-200';
        statusText = 'Đã qua';
        isDisabled = true;
      }
      else {
        // Đọc trạng thái từ Map tổng hợp. Nếu ngày này không bị ai đặt (Map trống), nó sẽ tự động nhận giá trị 'available' (Trống)
        const status = dailyMap[currentDate] || 'available';

        if (status === 'booked') {
          bgClass = 'bg-gray-200 text-gray-700 border-gray-300';
          statusText = 'Đã đặt';
          isDisabled = true;
        }
        else if (status === 'occupied') {
          bgClass = 'bg-green-100 text-green-800 border-green-400 shadow-sm';
          statusText = 'Đang thuê';
          isDisabled = true;
        }
        else if (status === 'maintenance') {
          bgClass = 'bg-red-100 text-red-800 border-red-400';
          statusText = 'Bảo trì';
          isDisabled = true;
        }
      }

      const isSelected = selectedDates.length > 0 && (
        currentDate === selectedDates[0] ||
        currentDate === selectedDates[1] ||
        (selectedDates.length === 2 && currentDate > selectedDates[0] && currentDate < selectedDates[1])
      );

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

  const getImageUrl = (imageSource) => {
    if (!imageSource) return 'https://placehold.co/600x400?text=Chua+Co+Anh';
    let imgPath = typeof imageSource === 'object' ? (imageSource.url || imageSource.image) : imageSource;
    if (!imgPath) return 'https://placehold.co/600x400?text=Chua+Co+Anh';
    if (imgPath.startsWith('http')) return imgPath;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
    const safePath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
    return `${baseUrl}${safePath}`;
  };

  if (bookingResult) {
    const bankId = "VCB"; const accountNo = "1234567890"; const accountName = "HOANG LAN VIEN FARMSTAY";
    const transferContent = `${bookingResult.bookingCode} - ${bookingResult.itemName}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${bookingResult.totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10 text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Đặt thuê xe thành công!</h2>
        <div className="bg-gray-50 border rounded-xl p-6 mb-8 max-w-lg mx-auto text-left shadow-sm">
          <p className="text-gray-700 mb-2">Xin chào <strong>{bookingResult.customerName}</strong>,</p>
          <p className="text-gray-700 mb-2">Mã đơn: <strong className="text-blue-600 text-lg">{bookingResult.bookingCode}</strong></p>
          <p className="text-gray-700 mb-2">Xe đã thuê: <strong>{bookingResult.itemName}</strong></p>
          <p className="text-gray-700 mb-2">Tổng số tiền: <strong className="text-red-600 text-lg">{bookingResult.totalPrice.toLocaleString()} VNĐ</strong></p>
        </div>

        {!showQR ? (
          <div className="flex flex-col items-center">
             <div className="bg-yellow-100 border border-yellow-300 px-6 py-4 rounded-lg mb-6 max-w-lg">
                <p className="font-semibold text-yellow-800 text-lg">Xác nhận thông tin đặt xe chính xác?</p>
            </div>
            <button onClick={() => setShowQR(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl">💳 Thanh toán ngay</button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center">
            <h3 className="font-bold text-2xl mb-2">Quét mã QR để thanh toán</h3>
            <div className="bg-white p-4 rounded-2xl shadow-md border mb-6"><img src={qrUrl} alt="QR" className="w-72 h-72 object-contain" /></div>
            <button onClick={() => navigate(0)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold">Hoàn tất</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 text-left">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600">&larr; Quay lại</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          {imageList.length > 0 ? (
            <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md bg-black">
              <img src={getImageUrl(imageList[currentImageIndex])} alt={motorbike.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Loi+Duong+Dan+Anh'; }} />
              {imageList.length > 1 && <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">&#10094;</button>}
              {imageList.length > 1 && <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">&#10095;</button>}
            </div>
          ) : <div className="w-full h-80 bg-gray-200 rounded-xl flex items-center justify-center">Chưa có ảnh</div>}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{motorbike.name}</h1>
            <p className="text-gray-500 mt-1">Biển số: <span className="font-semibold text-gray-800">{motorbike.license_plate || "Chưa cập nhật"}</span></p>
            <div className="mt-4"><span className="text-2xl font-bold text-red-600">{Number(motorbike.base_price).toLocaleString()} đ</span><span className="text-gray-500 text-sm"> / ngày</span></div>
            <p className="text-gray-600 mt-4">{motorbike.description || "Xe máy đời mới, chạy êm, tiết kiệm xăng."}</p>
          </div>

          <form onSubmit={handleBookingSubmit} className="mt-6 bg-gray-50 p-4 rounded-xl border space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase">THÔNG TIN ĐẶT XE</h3>
            <div className="text-xs text-blue-600 font-semibold">
              {selectedDates.length > 0 ? `Đã chọn: ${selectedDates.length === 1 ? selectedDates[0] : `Từ ${selectedDates[0]} đến ${selectedDates[1]}`} (${totalDays} ngày)` : '👉 Vui lòng click chọn ngày thuê trên lịch'}
            </div>

            {/* 👉 ĐÃ THÊM: Ô nhập Tên phòng */}
            <input type="text" placeholder="Tên phòng bạn đang ở (nếu có)" value={customerForm.roomName} onChange={e => setCustomerForm({...customerForm, roomName: e.target.value})} className="w-full border p-2 rounded text-sm bg-yellow-50" />

            <input type="text" placeholder="Họ và tên *" value={customerForm.fullname} onChange={e => setCustomerForm({...customerForm, fullname: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="tel" placeholder="Số điện thoại *" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="email" placeholder="Email *" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full border p-2 rounded text-sm" required />

            {selectedDates.length > 0 && <div className="text-sm font-bold text-red-600 pt-1">Tổng tiền tạm tính: {totalPrice.toLocaleString()} đ</div>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow">📅 Xác nhận đặt xe</button>
          </form>
        </div>
      </div>
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch xe trống (Click chọn ngày thuê)</h2>
        <div className="grid grid-cols-7 gap-3">{renderCalendarDays()}</div>
      </div>
    </div>
  );
}