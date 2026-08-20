import { useState, useEffect } from 'react';

export default function MotorbikeBookingList() {
  const [bookings, setBookings] = useState([]);
  const [motorbikeMap, setMotorbikeMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMotorbikeNames = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
      let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/motorbikes/`, { headers });

      const data = await res.json();
      let list = Array.isArray(data) ? data : (data.results || data.data || []);
      if (!Array.isArray(list)) list = Object.values(data).find(val => Array.isArray(val)) || [];

      const map = {};
      list.forEach(item => {
        if (item.id && item.name) map[item.id] = item.name;
      });
      setMotorbikeMap(map);
    } catch (err) {
      console.error("Lỗi lấy danh sách Xe máy:", err);
    }
  };

  const fetchMotorbikeBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };

      let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/motorbike-bookings/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/client/motorbike-bookings/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbike-bookings/`, { headers });

      const data = await res.json();
      const bookingList = Array.isArray(data) ? data : (data.results || data.data || []);

      const sortedBookings = bookingList.sort((a, b) => {
        if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
        return (b.id || 0) - (a.id || 0);
      });

      setBookings(sortedBookings);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải dữ liệu đặt xe:", err);
      setBookings([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorbikeNames();
    fetchMotorbikeBookings();
  }, []);

  const formatBookingDate = (booking) => {
    if (booking.created_at) return new Date(booking.created_at).toLocaleString('vi-VN');

    if (booking.booking_code && booking.booking_code.startsWith('MX')) {
      const code = booking.booking_code;
      if (code.length >= 14) {
        const datePart = code.slice(-14, -2);
        if (/^\d{12}$/.test(datePart)) {
          const dd = datePart.substring(0, 2);
          const mm = datePart.substring(2, 4);
          const yyyy = datePart.substring(4, 8);
          const hh = datePart.substring(8, 10);
          const mins = datePart.substring(10, 12);
          return `${hh}:${mins} - ${dd}/${mm}/${yyyy}`;
        }
      }
    }
    return 'Không rõ (Lỗi dữ liệu)';
  };

  const handleUpdateStatus = (id, newStatus) => {
    if (!window.confirm("Bạn có chắc chắn muốn chuyển trạng thái đơn này?")) return;

    const token = localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbike-bookings/${id}/`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ status: newStatus })
    })
    .then(async (res) => {
      if (!res.ok) {
         return fetch(`${import.meta.env.VITE_API_BASE_URL}/motorbike-bookings/${id}/`, {
            method: 'PATCH', headers, body: JSON.stringify({ status: newStatus })
         }).then(r => r.json());
      }
      return res.json();
    })
    .then(data => {
      if (data.id || data.success) {
        // Mọi việc đã có Backend lo!
        alert("Cập nhật trạng thái thành công!");
        fetchMotorbikeBookings();
      } else {
        alert("Lỗi không thể cập nhật!");
      }
    })
    .catch(err => alert("Lỗi kết nối máy chủ!"));
  };
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Chờ thanh toán</span>;
      case 'paid': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Đã thanh toán</span>;
      case 'checked_in': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Đang thuê (Đã nhận)</span>;
      case 'checked_out': return <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">Đã Trả xe</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Đã Hủy</span>;
      default: return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Mới đặt</span>;
    }
  };

  const renderActionButtons = (booking) => {
    const status = booking.status || 'pending';
    return (
      <div className="flex flex-col gap-2">
        {(status === 'pending' || !booking.status) && (
          <button onClick={() => handleUpdateStatus(booking.id, 'paid')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Xác nhận Đã TT
          </button>
        )}

        {status === 'paid' && (
          <button onClick={() => handleUpdateStatus(booking.id, 'checked_in')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Khách Nhận xe
          </button>
        )}

        {status === 'checked_in' && (
          <button onClick={() => handleUpdateStatus(booking.id, 'checked_out')} className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Khách Trả xe
          </button>
        )}

        {(status === 'pending' || status === 'paid') && (
          <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} className="text-red-500 hover:text-red-700 text-xs underline mt-1">
            Hủy đặt xe
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center font-semibold text-gray-600">Đang tải dữ liệu đặt xe...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt xe</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 text-gray-700 text-sm border-b">
              <th className="px-4 py-4 font-bold">Mã Đơn / Ngày đặt</th>
              <th className="px-4 py-4 font-bold">Khách hàng</th>
              <th className="px-4 py-4 font-bold">Thời gian thuê</th>
              <th className="px-4 py-4 font-bold text-center">Trạng thái</th>
              <th className="px-4 py-4 font-bold text-center">Xử lý</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500 italic">Chưa có dữ liệu đặt xe nào.</td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const motorbikeId = booking.motorbike_id || booking.motorbike;
                const motorbikeName = motorbikeMap[motorbikeId] || `Xe ID: ${motorbikeId}`;

                // 👉 Trích xuất Tên, SĐT và Tên Phòng từ chính đơn đặt xe
                const finalCustomerName = booking.full_name || booking.fullname || booking.customer_name || booking.name || 'Khách chưa có tên';
                const finalCustomerPhone = booking.phone || booking.phone_number || booking.customer_phone || 'Chưa cập nhật SĐT';

                // Bóc tách tên phòng ra khỏi dòng ghi chú
                const roomInfo = booking.room_name || (booking.notes && booking.notes.includes('phòng:') ? booking.notes : 'Khách vãng lai / Không ghi phòng');

                return (
                  <tr key={booking.id} className="hover:bg-blue-50 border-b transition">
                    <td className="px-4 py-4">
                      <p className="font-bold text-blue-600">{booking.booking_code || `DH-${booking.id}`}</p>
                      <p className="text-sm font-semibold text-purple-600 mt-1">Xe: {motorbikeName}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatBookingDate(booking)}</p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-800">{finalCustomerName}</p>
                      <p className="text-sm text-gray-600">📞 {finalCustomerPhone}</p>

                      {/* 👉 ĐÃ THÊM: Hiển thị thông tin phòng khách ở */}
                      <p className="text-xs text-orange-600 font-semibold mt-1">🏠 {roomInfo}</p>

                      {booking.email && <p className="text-xs text-gray-500 mt-1">✉️ {booking.email}</p>}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <span className="font-semibold text-green-700">IN:</span> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString('vi-VN') : 'N/A'} <br/>
                        <span className="font-semibold text-red-700">OUT:</span> {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center align-middle">
                      {renderStatusBadge(booking.status)}
                    </td>

                    <td className="px-4 py-4 text-center align-middle">
                      {renderActionButtons(booking)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}