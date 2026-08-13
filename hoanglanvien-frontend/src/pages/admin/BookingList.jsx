import { useState, useEffect } from 'react';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [bungalowMap, setBungalowMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchBungalowNames = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
      let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bungalows/`, { headers });

      const data = await res.json();
      let list = Array.isArray(data) ? data : (data.results || data.data || []);
      if (!Array.isArray(list)) list = Object.values(data).find(val => Array.isArray(val)) || [];

      const map = {};
      list.forEach(item => {
        if (item.id && item.name) map[item.id] = item.name;
      });
      setBungalowMap(map);
    } catch (err) {
      console.error("Lỗi lấy danh sách Bungalow:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };

      let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customers/`, { headers });
      if (!res.ok) return;

      const data = await res.json();
      let list = Array.isArray(data) ? data : (data.results || data.data || []);
      if (!Array.isArray(list)) list = Object.values(data).find(val => Array.isArray(val)) || [];

      const map = {};
      list.forEach(c => {
        if (c.id) {
          map[c.id] = {
            name: c.name || c.full_name || c.fullname || c.username,
            phone: c.phone || c.phone_number
          };
        }
      });
      setCustomerMap(map);
    } catch (err) {
      console.error("Lỗi lấy danh sách Khách hàng:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };

      let res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bookings/`, { headers });
      if (!res.ok) res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/`, { headers });

      const data = await res.json();
      const bookingList = Array.isArray(data) ? data : (data.results || data.data || []);

      const sortedBookings = bookingList.sort((a, b) => {
        if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
        return (b.id || 0) - (a.id || 0);
      });

      setBookings(sortedBookings);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải dữ liệu đặt phòng:", err);
      setBookings([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBungalowNames();
    fetchCustomers();
    fetchBookings();
  }, []);

  const formatBookingDate = (booking) => {
    if (booking.created_at) return new Date(booking.created_at).toLocaleString('vi-VN');
    if (booking.booking_code && booking.booking_code.startsWith('BK')) {
      const timestamp = parseInt(booking.booking_code.replace('BK', ''));
      if (!isNaN(timestamp) && timestamp > 1000000000000) {
        return new Date(timestamp).toLocaleString('vi-VN');
      }
    }
    return 'Không rõ (Lỗi DB)';
  };

  // 👉 ĐÃ SỬA: Thay thế chức năng Event của Laravel bằng React Syncing
  const handleUpdateStatus = (id, newStatus) => {
    if (!window.confirm("Bạn có chắc chắn muốn chuyển trạng thái đơn này?")) return;

    const token = localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bookings/${id}/`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(async data => {
      if (data.id) {
        // --- MÔ PHỎNG LARAVEL EVENT BẮT ĐẦU TỪ ĐÂY ---
        const bookingToUpdate = bookings.find(b => b.id === id);
        if (bookingToUpdate) {
          const bungalowId = bookingToUpdate.bungalow_id || bookingToUpdate.bungalow;
          try {
            // Lấy danh sách đang hiển thị, sửa tạm trạng thái của đơn hiện tại để tính toán
            const activeBookings = bookings
              .map(b => b.id === id ? { ...b, status: newStatus } : b)
              .filter(b => (String(b.bungalow) === String(bungalowId) || String(b.bungalow_id) === String(bungalowId)) && b.status !== 'cancelled');

            const newDailyMap = {};
            activeBookings.forEach(b => {
               let dayStatus = 'booked';
               if (b.status === 'checked_in') dayStatus = 'occupied'; // Nhận diện đang ở
               if (b.status === 'maintenance') dayStatus = 'maintenance';

               if (b.check_in_date && b.check_out_date) {
                 let curr = new Date(b.check_in_date);
                 const end = new Date(b.check_out_date);
                 while (curr <= end) {
                   const year = curr.getFullYear();
                   const month = String(curr.getMonth() + 1).padStart(2, '0');
                   const day = String(curr.getDate()).padStart(2, '0');
                   const dStr = `${year}-${month}-${day}`;

                   // Ưu tiên trạng thái "Đang ở" ghi đè lên các trạng thái khác
                   if (newDailyMap[dStr] !== 'occupied') newDailyMap[dStr] = dayStatus;
                   curr.setDate(curr.getDate() + 1);
                 }
               }
            });

            // Patch update đè lịch mới vào DB của Bungalow
            let updateUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${bungalowId}/`;
            let patchRes = await fetch(updateUrl, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ daily_status: JSON.stringify(newDailyMap) })
            });
            if (!patchRes.ok) {
              await fetch(`${import.meta.env.VITE_API_BASE_URL}/bungalows/${bungalowId}/`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ daily_status: JSON.stringify(newDailyMap) })
              });
            }
          } catch(err) {
            console.error("Lỗi đồng bộ lịch vào Bungalow:", err);
          }
        }
        // --- KẾT THÚC MÔ PHỎNG EVENT ---

        alert("Cập nhật trạng thái thành công!");
        fetchBookings();
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
      case 'checked_in': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Đang ở</span>;
      case 'checked_out': return <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">Đã Check-out</span>;
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
              bookings.map((booking) => {
                const bungalowId = booking.bungalow_id || booking.bungalow;
                const bungalowName = bungalowMap[bungalowId] || `Phòng ID: ${bungalowId}`;

                const customerId = booking.customer;
                const customerDict = customerMap[customerId] || {};
                const finalCustomerName = booking.customer_name || customerDict.name || `Khách hàng (ID: ${customerId})`;
                const finalCustomerPhone = booking.customer_phone || customerDict.phone || 'Chưa cập nhật SĐT';

                return (
                  <tr key={booking.id} className="hover:bg-blue-50 border-b transition">
                    <td className="px-4 py-4">
                      <p className="font-bold text-blue-600">{booking.booking_code || `DH-${booking.id}`}</p>
                      <p className="text-sm font-semibold text-purple-600 mt-1">
                        Phòng: {bungalowName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatBookingDate(booking)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-800">{finalCustomerName}</p>
                      <p className="text-sm text-gray-600">📞 {finalCustomerPhone}</p>
                      {booking.customer_email && <p className="text-xs text-gray-500">✉️ {booking.customer_email}</p>}
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