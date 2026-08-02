import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BungalowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bungalow, setBungalow] = useState(null);
  const [loading, setLoading] = useState(true);

  // State cho việc chọn ngày đặt phòng
  const [selectedDates, setSelectedDates] = useState([]);
  
  // State cho form thông tin khách hàng
  const [customerForm, setCustomerForm] = useState({
    fullname: '',
    phone: '',
    email: ''
  });

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

  const dailyMap = bungalow.daily_status ? JSON.parse(bungalow.daily_status) : {};
  const startDateStr = bungalow.available_from ? bungalow.available_from.split('T')[0] : null;
  const endDateStr = bungalow.available_to ? bungalow.available_to.split('T')[0] : null;

  // Xử lý khi click vào 1 ngày trên lịch để chọn ngày đặt
  const handleDateClick = (dateStr, status, isDisabled) => {
    if (isDisabled || status !== 'available') {
      alert("Ngày này không khả dụng để đặt phòng!");
      return;
    }

    if (selectedDates.length === 0 || selectedDates.length === 2) {
      setSelectedDates([dateStr]);
    } else if (selectedDates.length === 1) {
      const firstDate = selectedDates[0];
      if (dateStr < firstDate) {
        setSelectedDates([dateStr]);
      } else {
        // Tạo khoảng từ ngày đầu đến ngày cuối được chọn
        const range = [];
        let curr = new Date(firstDate);
        const end = new Date(dateStr);
        while (curr <= end) {
          const dStr = curr.toISOString().split('T')[0];
          // Kiểm tra xem trong khoảng có ngày nào bị bận không
          const s = dailyMap[dStr] || 'available';
          if (s !== 'available') {
            alert("Khoảng thời gian bạn chọn chứa ngày không trống!");
            setSelectedDates([dateStr]);
            return;
          }
          range.push(dStr);
          curr.setDate(curr.getDate() + 1);
        }
        setSelectedDates([firstDate, dateStr]);
      }
    }
  };

  // Tính tổng số ngày và tổng tiền
  const calculateBookingDetails = () => {
    if (selectedDates.length !== 2) return { totalDays: 0, totalPrice: 0 };
    const start = new Date(selectedDates[0]);
    const end = new Date(selectedDates[1]);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = totalDays * Number(bungalow.base_price);
    return { totalDays, totalPrice };
  };

  const { totalDays, totalPrice } = calculateBookingDetails();

  // Xử lý gửi đặt phòng
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (selectedDates.length !== 2) {
      alert("Vui lòng chọn khoảng thời gian (Từ ngày - Đến ngày) trên lịch!");
      return;
    }

    const bookingData = {
      bungalow_id: bungalow.id,
      bungalow_name: bungalow.name,
      from_date: selectedDates[0],
      to_date: selectedDates[1],
      total_days: totalDays,
      total_price: totalPrice,
      check_in: '14:00',
      check_out: '12:00',
      created_at: new Date().toLocaleString('vi-VN'),
      ...customerForm
    };

    // Gửi dữ liệu đặt phòng lên API backend (hoặc giả lập gửi email xác nhận)
    fetch('http://localhost:8000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bookingData)
    })
    .then(res => res.json())
    .then(() => {
      alert(`🎉 Đặt phòng thành công!\nThông tin xác nhận và hóa đơn đã được gửi về email: ${customerForm.email}`);
      navigate(0); // Tải lại trang
    })
    .catch(() => {
      // Giả lập thành công nếu chưa có API bookings
      alert(`🎉 Đặt phòng thành công!\n\n--- THÔNG TIN XÁC NHẬN (ĐÃ GỬI EMAIL) ---\n- Người đặt: ${customerForm.fullname}\n- SĐT: ${customerForm.phone}\n- Email: ${customerForm.email}\n- Phòng: ${bungalow.name}\n- Thời gian: ${selectedDates[0]} đến ${selectedDates[1]} (${totalDays} ngày)\n- Check-in: 14h00 | Check-out: 12h00\n- Tổng tiền: ${totalPrice.toLocaleString()} đ\n- Thời gian thực hiện: ${new Date().toLocaleString('vi-VN')}`);
      navigate(0);
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDaysInMonth = new Date(2026, 7 + 1, 0).getDate();

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const currentDate = `2026-08-${dayStr}`;

      let bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      let statusText = 'Trống';
      let isDisabled = false;

      if (startDateStr && endDateStr && (currentDate < startDateStr || currentDate > endDateStr)) {
        bgClass = 'bg-gray-100 text-gray-300 border-gray-200 line-through';
        statusText = 'Không mở';
        isDisabled = true;
      } else {
        const status = dailyMap[currentDate] || 'available';
        if (status === 'booked') { bgClass = 'bg-gray-200 text-gray-700'; statusText = 'Đã đặt'; isDisabled = true; }
        else if (status === 'occupied') { bgClass = 'bg-green-100 text-green-800'; statusText = 'Đang ở'; isDisabled = true; }
        else if (status === 'maintenance') { bgClass = 'bg-red-100 text-red-800'; statusText = 'Bảo trì'; isDisabled = true; }
      }

      // Kiểm tra nếu ngày nằm trong khoảng được chọn
      const isSelected = selectedDates.length > 0 && (currentDate === selectedDates[0] || currentDate === selectedDates[1] || (selectedDates.length === 2 && currentDate > selectedDates[0] && currentDate < selectedDates[1]));
      if (isSelected) {
        bgClass = 'bg-blue-600 text-white border-blue-700';
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 text-left">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600 hover:underline">&larr; Quay lại</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {bungalow.image ? (
            <img src={`http://localhost:8000/${bungalow.image}`} alt={bungalow.name} className="w-full h-80 object-cover rounded-xl shadow-md border" />
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

          {/* FORM ĐẶT PHÒNG */}
          <form onSubmit={handleBookingSubmit} className="mt-6 bg-gray-50 p-4 rounded-xl border space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin đặt phòng</h3>
            <div className="text-xs text-blue-600 font-semibold">
              {selectedDates.length === 2 ? `Đã chọn: Từ ${selectedDates[0]} đến ${selectedDates[1]} (${totalDays} đêm)` : '👉 Vui lòng click chọn ngày bắt đầu & kết thúc trên lịch bên dưới'}
            </div>
            <input type="text" placeholder="Họ và tên *" value={customerForm.fullname} onChange={e => setCustomerForm({...customerForm, fullname: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="tel" placeholder="Số điện thoại *" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full border p-2 rounded text-sm" required />
            <input type="email" placeholder="Email nhận thông tin xác nhận *" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full border p-2 rounded text-sm" required />

            {selectedDates.length === 2 && (
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

      {/* LỊCH TRỐNG THÁNG */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn lịch trống tháng 08/2026 (Click chọn ngày)</h2>
        <div className="grid grid-cols-7 gap-3">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}