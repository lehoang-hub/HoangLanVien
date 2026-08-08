import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MotorbikeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motorbike, setMotorbike] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);
  
  const [customerForm, setCustomerForm] = useState({ fullname: '', phone: '', email: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/${id}`)
  .then(res => res.json())
      .then(data => { setMotorbike(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-10 text-center">Đang tải chi tiết xe...</div>;
  if (!motorbike) return <div className="p-10 text-center text-red-500">Không tìm thấy xe!</div>;

  let parsedImages = [];
  if (motorbike.images) {
    if (typeof motorbike.images === 'string') {
      try { parsedImages = JSON.parse(motorbike.images); } catch (e) { parsedImages = []; }
    } else if (Array.isArray(motorbike.images)) { parsedImages = motorbike.images; }
  }

  const imageList = parsedImages.length > 0 ? parsedImages.map(img => img.url || img) : (motorbike.image ? [motorbike.image] : []);
  const handlePrevImage = () => setCurrentImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  const handleNextImage = () => setCurrentImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));

  let dailyMap = {};
  try {
    dailyMap = typeof motorbike.daily_status === 'string' 
      ? JSON.parse(motorbike.daily_status) 
      : (motorbike.daily_status || {});
  } catch (e) {
    dailyMap = {};
  }

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
    
    // 👉 ĐÃ SỬA: Kiểm tra trạng thái đăng nhập ngay khi bấm Form
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert("Vui lòng đăng nhập tài khoản để tiếp tục đặt dịch vụ!");
      navigate('/auth', { state: { isLogin: true } });
      return; 
    }

    if (selectedDates.length === 0) { alert("Vui lòng click chọn ngày thuê trên lịch!"); return; }

    const bookingData = {
      full_name: customerForm.fullname, phone: customerForm.phone, email: customerForm.email,
      check_in_date: selectedDates[0],
      check_out_date: selectedDates.length === 2 ? selectedDates[1] : selectedDates[0],
      motorbike_id: motorbike.id, notes: "Khách đặt thuê xe từ Web"
    };

    fetch(`${import.meta.env.VITE_API_BASE_URL}/client/motorbike-bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: JSON.stringify(bookingData)
})
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setBookingResult({ bookingCode: data.booking_code, itemName: motorbike.name, totalPrice, customerName: customerForm.fullname });
      } else alert("Lỗi: " + (data.message || "Không thể đặt xe"));
    }).catch(err => alert("Lỗi kết nối tới máy chủ!"));
  };

  const renderCalendarDays = () => {
    const days = []; 
    const today = new Date();
    
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const configuredDates = Object.keys(dailyMap).sort();

    if (configuredDates.length === 0) {
      return <div className="col-span-7 text-center text-gray-500 py-8">Xe này hiện chưa có lịch trống.</div>;
    }

    configuredDates.forEach(currentDate => {
      let bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-300'; 
      let statusText = 'Trống'; 
      let isDisabled = false;

      if (currentDate < todayStr) { 
        bgClass = 'bg-gray-100 text-gray-400 border-gray-200'; 
        statusText = 'Đã qua'; 
        isDisabled = true; 
      } 
      else {
        const status = dailyMap[currentDate] || 'available';
        if (status === 'booked') { bgClass = 'bg-gray-200 text-gray-700 border-gray-300'; statusText = 'Đã đặt'; isDisabled = true; }
        else if (status === 'occupied') { bgClass = 'bg-green-100 text-green-800 border-green-400 shadow-sm'; statusText = 'Đang thuê'; isDisabled = true; }
        else if (status === 'maintenance') { bgClass = 'bg-red-100 text-red-800 border-red-400'; statusText = 'Bảo trì'; isDisabled = true; }
      }

      const isSelected = selectedDates.length > 0 && (
        currentDate === selectedDates[0] || 
        currentDate === selectedDates[1] || 
        (selectedDates.length === 2 && currentDate > selectedDates[0] && currentDate < selectedDates[1])
      );
      
      if (isSelected && !isDisabled) {
        bgClass = 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';
      }

      const [yyyy, mm, dd] = currentDate.split('-');
      const displayDate = `${dd}/${mm}`;

      days.push(
        <div 
          key={currentDate} 
          onClick={() => handleDateClick(currentDate, dailyMap[currentDate] || 'available', isDisabled)} 
          className={`p-4 border rounded-xl text-center font-semibold transition cursor-pointer ${bgClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <div className="text-lg font-bold">{displayDate}</div>
          <div className="text-xs mt-1 uppercase">{statusText}</div>
        </div>
      );
    });

    return days;
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
              <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${imageList[currentImageIndex]}`} alt={motorbike.name} className="w-full h-full object-cover" />
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
            <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin đặt xe</h3>
            <div className="text-xs text-blue-600 font-semibold">
              {selectedDates.length > 0 ? `Đã chọn: ${selectedDates.length === 1 ? selectedDates[0] : `Từ ${selectedDates[0]} đến ${selectedDates[1]}`} (${totalDays} ngày)` : '👉 Vui lòng click chọn ngày thuê trên lịch'}
            </div>
            <input type="text" placeholder="Họ và tên *" value={customerForm.fullname} onChange={e => setCustomerForm({...customerForm, fullname: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="tel" placeholder="Số điện thoại *" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="email" placeholder="Email *" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            {selectedDates.length > 0 && <div className="text-sm font-bold text-red-600 pt-1">Tổng tiền tạm tính: {totalPrice.toLocaleString()} đ</div>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow">📅 Xác nhận đặt xe</button>
          </form>
        </div>
      </div>
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch xe trống tháng 08/2026 (Click chọn ngày thuê)</h2>
        <div className="grid grid-cols-7 gap-3">{renderCalendarDays()}</div>
      </div>
    </div>
  );
}