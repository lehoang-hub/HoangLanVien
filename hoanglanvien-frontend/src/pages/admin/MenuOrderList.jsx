import { useState, useEffect } from 'react';

export default function MenuOrderList() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. DỮ LIỆU MẪU (Mock Data) - Xóa đi sau khi Backend có API
  const mockOrders = [
    {
      id: 1,
      order_code: "ORD-110826A",
      customer_name: "Anh Tuấn",
      room_number: "Bungalow VIP 6",
      order_time: "2026-08-11T18:15:00",
      notes: "Cà phê cho nhiều đá. Mì xào không cay nhé.",
      total_price: 180000,
      status: "pending",
      items: [
        { name: "Cà phê sữa đá", quantity: 2, price: 35000 },
        { name: "Mì xào hải sản", quantity: 1, price: 110000 }
      ]
    },
    {
      id: 2,
      order_code: "ORD-110826B",
      customer_name: "Chị Lan",
      room_number: "Family 1",
      order_time: "2026-08-11T17:45:00",
      notes: "Mang thêm 2 cái ly trống giúp mình.",
      total_price: 250000,
      status: "completed",
      items: [
        { name: "Bia Heineken", quantity: 5, price: 30000 },
        { name: "Mực nướng", quantity: 1, price: 100000 }
      ]
    }
  ];

  useEffect(() => {
    // 2. KẾT NỐI API THỰC TẾ
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/food-orders/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // 🟢 BẢO VỆ DỮ LIỆU: Ép kiểu mảng để tránh lỗi .map() khi API trả về báo lỗi 401
        setOrders(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      }
    };
    fetchOrders();

    // Tạm thời dùng dữ liệu mẫu (sẽ bị ghi đè nếu API gọi thành công)
    setOrders(mockOrders);
  }, []);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/food-orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
        setIsModalOpen(false);
        alert("Đã cập nhật trạng thái đơn hàng thành công!");
      } else {
        alert("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">🛎️ Quản lý Đơn Đặt Món</h1>
            <p className="text-gray-500 text-sm mt-1">Danh sách các yêu cầu phục vụ đồ ăn, thức uống từ khách hàng.</p>
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 font-semibold text-sm">
            <tr>
              <th className="px-6 py-4">Mã Đơn / Ngày giờ</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Số phòng</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-t hover:bg-orange-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-blue-600">{order.order_code}</div>
                  <div className="text-sm text-gray-500">{formatDate(order.created_at || order.order_time)}</div>
                </td>
                <td className="px-6 py-4 font-medium">{order.customer_name || 'Khách vãng lai'}</td>
                <td className="px-6 py-4 font-bold text-orange-600">{order.room_number}</td>
                <td className="px-6 py-4 font-bold text-red-600">{Number(order.total_price).toLocaleString()} đ</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {order.status === 'pending' ? 'Đang chờ' : 'Đã giao'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => openDetails(order)}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded shadow-sm font-medium transition"
                  >
                    🔍 Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-orange-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Chi tiết đơn: <span className="text-blue-600">{selectedOrder.order_code}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-3xl font-bold leading-none">&times;</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                        <p className="text-sm text-gray-500">Khách đặt</p>
                        <p className="font-bold text-gray-800">{selectedOrder.customer_name || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Giao đến phòng</p>
                        <p className="font-bold text-orange-600 text-lg">{selectedOrder.room_number}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Thời gian đặt</p>
                        <p className="font-medium text-gray-800">{formatDate(selectedOrder.created_at || selectedOrder.order_time)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Trạng thái</p>
                        <p className="font-medium text-yellow-600">{selectedOrder.status === 'pending' ? 'Đang chuẩn bị...' : 'Hoàn tất'}</p>
                    </div>
                </div>

                {selectedOrder.notes && (
                    <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <p className="text-sm font-bold text-yellow-800 mb-1">📝 Ghi chú từ khách:</p>
                        <p className="text-gray-700 italic">{selectedOrder.notes}</p>
                    </div>
                )}

                <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm border-b pb-2">Danh sách món ăn</h3>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-4 py-2">Tên món</th>
                                <th className="px-4 py-2 text-center">Số lượng</th>
                                <th className="px-4 py-2 text-right">Đơn giá</th>
                                <th className="px-4 py-2 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items.map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">{Number(item.price).toLocaleString()} đ</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">{(item.quantity * item.price).toLocaleString()} đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-2xl flex justify-between items-center">
              <div className="text-lg">
                <span className="font-semibold text-gray-600 mr-2">Tổng cộng:</span>
                <span className="text-2xl font-bold text-red-600">{Number(selectedOrder.total_price).toLocaleString()} đ</span>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition">Đóng</button>
                  {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md"
                        >
                        ✔️ Đánh dấu Đã Giao
                      </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}