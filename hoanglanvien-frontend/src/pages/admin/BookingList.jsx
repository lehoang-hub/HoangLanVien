import { useState, useEffect } from 'react';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu danh sách đặt phòng
  const fetchBookings = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bookings`)
  .then(res => res.json())
      .then(data => {
        const bookingList = Array.isArray(data) ? data : (data.data || []);
        setBookings(bookingList);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu đặt phòng:", err);
        setBookings([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Hàm xử lý khi bấm các nút chuyển trạng thái
  const handleUpdateStatus = (id, newStatus) => {
    if (!window.confirm("Bạn có chắc chắn muốn chuyển trạng thái đơn này?")) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bookings/${id}/status`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ status: newStatus })
})
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Cập nhật trạng thái thành công!");
        fetchBookings(); // Load lại danh sách
      } else {
        alert("Lỗi: " + data.message);
      }
    })
    .catch(err => alert("Lỗi kết nối máy chủ!"));
  };

  // Hàm hiển thị Badge Trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Chờ thanh toán</span>;
      case 'paid': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Đã thanh toán</span>;
      case 'checked_in': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Đang ở (Check-in)</span>;
      case 'checked_out': return <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">Đã Check-out</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Đã Hủy</span>;
      default: return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Mới đặt</span>;
    }
  };

  // Hàm hiển thị Nút Hành động dựa theo Trạng thái hiện tại
  const renderActionButtons = (booking) => {
    const status = booking.status || 'pending'; // Mặc định là pending nếu chưa có

    return (
      <div className="flex flex-col gap-2">
        {(status === 'pending' || !booking.status) && (
          <button onClick={() => handleUpdateStatus(booking.id, 'paid')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Xác nhận Đã thanh toán
          </button>
        )}
        
        {status === 'paid' && (
          <button onClick={() => handleUpdateStatus(booking.id, 'checked_in')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Khách Check-in
          </button>
        )}

        {status === 'checked_in' && (
          <button onClick={() => handleUpdateStatus(booking.id, 'checked_out')} className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded shadow">
            Khách Check-out
          </button>
        )}

        {(status === 'pending' || status === 'paid') && (
          <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} className="text-red-500 hover:text-red-700 text-xs underline mt-1">
            Hủy đơn
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center font-semibold text-gray-600">Đang tải dữ liệu đặt phòng...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt phòng</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 text-gray-700 text-sm border-b">
              <th className="px-4 py-4 font-bold">Mã Đơn / Ngày đặt</th>
              <th className="px-4 py-4 font-bold">Khách hàng</th>
              <th className="px-4 py-4 font-bold">Thời gian ở</th>
              <th className="px-4 py-4 font-bold text-center">Trạng thái</th>
              <th className="px-4 py-4 font-bold text-center">Xử lý</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500 italic">Chưa có dữ liệu đặt phòng nào.</td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50 border-b transition">
                  {/* Cột 1: Mã Đơn */}
                  <td className="px-4 py-4">
                    <p className="font-bold text-blue-600">{booking.booking_code || `DH-${booking.id}`}</p>
                    <p className="text-sm font-semibold text-purple-600 mt-1">Phòng: {booking.bungalow_name || `Không rõ (ID: ${booking.bungalow_id})`}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(booking.created_at).toLocaleString('vi-VN')}</p>
                  </td>

                  {/* Cột 2: Thông tin Khách */}
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-800">{booking.full_name}</p>
                    <p className="text-sm text-gray-600">📞 {booking.phone}</p>
                    {booking.email && <p className="text-xs text-gray-500">✉️ {booking.email}</p>}
                  </td>

                  {/* Cột 3: Thời gian & Tiền */}
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <span className="font-semibold text-green-700">IN:</span> {new Date(booking.check_in_date).toLocaleDateString('vi-VN')} <br/>
                      <span className="font-semibold text-red-700">OUT:</span> {new Date(booking.check_out_date).toLocaleDateString('vi-VN')}
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái */}
                  <td className="px-4 py-4 text-center">
                    {renderStatusBadge(booking.status)}
                  </td>

                  {/* Cột 5: Nút xử lý */}
                  <td className="px-4 py-4 text-center align-middle">
                    {renderActionButtons(booking)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}