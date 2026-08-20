import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BungalowList() {
  const [bungalows, setBungalows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  // === CÁC STATE ĐỂ XỬ LÝ LỊCH THỜI GIAN THỰC ===
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentDailyMap, setCurrentDailyMap] = useState({});
  const [syncingDate, setSyncingDate] = useState(null); // Trạng thái ngày đang chờ lưu
  const [isUpdatingCalendar, setIsUpdatingCalendar] = useState(false); // Trạng thái đang lưu DB

  const navigate = useNavigate();

  const fetchBungalows = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ máy chủ');
      const data = await response.json();
      setBungalows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBungalows();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${name}" không? Thao tác này không thể hoàn tác.`)) {
      setIsDeleting(id);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${id}/`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Xóa không thành công. Vui lòng kiểm tra lại.');
        setBungalows(bungalows.filter(b => b.id !== id));
        alert('Đã xóa Bungalow thành công.');
      } catch (err) {
        alert(`Lỗi: ${err.message}`);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/bungalows/edit/${id}`);
  };

  const handleAddNew = () => {
    navigate('/admin/bungalows/create');
  };

  // ==========================================
  // LOGIC QUẢN LÝ LỊCH (CALENDAR)
  // ==========================================

  // 1. Mở Modal và bóc tách dữ liệu JSON daily_status
  const openCalendarModal = (room) => {
    setSelectedRoom(room);
    try {
      // Thử đọc chuỗi JSON từ DB. Nếu lỗi (hoặc rỗng) thì dùng mảng rỗng {}
      const parsedMap = room.daily_status ? JSON.parse(room.daily_status) : {};
      setCurrentDailyMap(parsedMap);
    } catch (e) {
      console.error("Lỗi đọc lịch phòng:", e);
      setCurrentDailyMap({});
    }
    setIsCalendarOpen(true);
  };

  const closeCalendarModal = () => {
    setIsCalendarOpen(false);
    setSelectedRoom(null);
    setCurrentDailyMap({});
  };

  // 2. Chuyển đổi trạng thái khi Admin click vào 1 ngày
  const toggleDateStatus = (dateStr) => {
    // Không cho phép đổi trạng thái nếu phòng đang có khách ở (Occupied)
    if (currentDailyMap[dateStr] === 'occupied') {
        alert("Phòng đang có khách ở, không thể đổi trạng thái thủ công!");
        return;
    }

    const newMap = { ...currentDailyMap };
    const currentStatus = newMap[dateStr] || 'available';

    // Vòng lặp đổi trạng thái: Trống (available) -> Đã đặt (booked) -> Bảo trì (maintenance) -> Về lại Trống
    let nextStatus = 'available';
    if (currentStatus === 'available' || currentStatus === 'Trống') nextStatus = 'booked';
    else if (currentStatus === 'booked') nextStatus = 'maintenance';
    else if (currentStatus === 'maintenance') nextStatus = 'available';

    newMap[dateStr] = nextStatus;
    setCurrentDailyMap(newMap);
    setSyncingDate(dateStr); // Đánh dấu ngày này đang cần lưu
  };

  // 3. Gửi lệnh PATCH lên Django để lưu lại lịch mới
  const saveCalendarStatus = async () => {
    if (!selectedRoom) return;
    setIsUpdatingCalendar(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${selectedRoom.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ daily_status: JSON.stringify(currentDailyMap) })
      });

      if (!response.ok) throw new Error("Không thể lưu thay đổi vào hệ thống");

      // Thành công: Cập nhật lại danh sách phòng ở ngoài để bảng ngoài cũng có dữ liệu mới nhất
      setBungalows(bungalows.map(b => b.id === selectedRoom.id ? { ...b, daily_status: JSON.stringify(currentDailyMap) } : b));
      alert("Đã lưu trạng thái lịch thành công!");
      setSyncingDate(null);
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    } finally {
        setIsUpdatingCalendar(false);
    }
  };

  // 4. Hàm vẽ giao diện các ô ngày trong tháng (Giống trang Khách hàng)
  const renderAdminCalendar = () => {
    const days = [];
    const today = new Date();
    // Giả lập lịch tháng 8/2026 (Hoặc bạn có thể dùng thư viện moment để lấy tháng hiện tại tự động)
    const year = 2026;
    const month = 8;
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const currentDate = `${year}-0${month}-${dayStr}`;

      let bgClass = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'; // Mặc định Trống
      let statusText = 'Trống';

      const status = currentDailyMap[currentDate] || 'available';

      if (status === 'booked') {
        bgClass = 'bg-gray-200 border-gray-400 text-gray-600';
        statusText = 'Khóa/Đã Đặt';
      } else if (status === 'occupied') {
        bgClass = 'bg-green-100 border-green-500 text-green-800 cursor-not-allowed';
        statusText = 'Đang Ở';
      } else if (status === 'maintenance') {
        bgClass = 'bg-red-100 border-red-500 text-red-800';
        statusText = 'Bảo Trì';
      }

      // Đánh dấu ngày vừa bị sửa (chưa lưu)
      const isUnsaved = syncingDate === currentDate;

      days.push(
        <div
          key={currentDate}
          onClick={() => toggleDateStatus(currentDate)}
          className={`p-3 border rounded-xl text-center font-semibold cursor-pointer transition-all ${bgClass} ${isUnsaved ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
        >
          <div className="text-xl font-bold">{i}</div>
          <div className="text-[10px] mt-1 uppercase">{statusText}</div>
        </div>
      );
    }
    return days;
  };


  if (isLoading) return <div className="text-center py-20 text-gray-500 font-medium">Đang tải danh sách phòng...</div>;
  if (error) return <div className="text-center py-20 text-red-500 font-medium">Lỗi kết nối API: {error}</div>;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bungalow</h1>
          <p className="text-gray-600 mt-1">Xem, thêm, sửa và quản lý lịch phòng.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <span>➕</span> Thêm Bungalow mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Hình ảnh</th>
                <th className="px-6 py-4">Tên phòng</th>
                <th className="px-6 py-4">Giá (VND)</th>
                <th className="px-6 py-4 text-center">Tình trạng Lịch</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bungalows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">Chưa có phòng nào. Hãy bấm "Thêm Bungalow mới".</td>
                </tr>
              ) : (
                bungalows.map((room) => {
                  const getImageUrl = (imageSource) => {
                    if (!imageSource) return null;
                    let imgPath = typeof imageSource === 'object' ? (imageSource.url || imageSource.image) : imageSource;
                    if (!imgPath) return null;
                    if (imgPath.startsWith('http')) return imgPath;
                    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                    return `${baseUrl}${imgPath.startsWith('/') ? imgPath : `/${imgPath}`}`;
                  };

                  const actualImage = getImageUrl(room.image || (room.images && room.images.length > 0 ? room.images[0] : null));

                  return (
                    <tr key={room.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-left">
                      <td className="px-6 py-4 font-mono text-gray-500">{room.id}</td>
                      <td className="px-6 py-4">
                        {actualImage ? (
                          <img src={actualImage} alt={room.name} className="w-16 h-12 object-cover rounded-md border border-gray-200" />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded-md border border-dashed flex items-center justify-center text-[10px] text-gray-500 px-1 text-center">Chưa có ảnh</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{room.name}</td>
                      <td className="px-6 py-4 text-red-600 font-semibold">{new Intl.NumberFormat('vi-VN').format(room.base_price || 0)} đ</td>

                      {/* CỘT MỚI: QUẢN LÝ LỊCH */}
                      <td className="px-6 py-4 text-center">
                         <button
                            onClick={() => openCalendarModal(room)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-1.5 px-4 rounded-full text-xs font-bold transition shadow-sm"
                         >
                            📅 Xem & Chỉnh Lịch
                         </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(room.id)} className="text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded border border-blue-200 hover:border-blue-300 bg-blue-50 transition-colors">Sửa</button>
                          <button onClick={() => handleDelete(room.id, room.name)} disabled={isDeleting === room.id} className="text-red-600 hover:text-red-800 font-medium py-1 px-3 rounded border border-red-200 hover:border-red-300 bg-red-50 transition-colors disabled:opacity-50">
                            {isDeleting === room.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL HIỂN THỊ LỊCH (NỔI LÊN TRÊN)         */}
      {/* ========================================== */}
      {isCalendarOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-hidden animate-fade-in">

                {/* Modal Header */}
                <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold">Lịch trống: {selectedRoom.name}</h2>
                        <p className="text-indigo-200 text-sm mt-1">Bấm vào các ô ngày để chuyển đổi trạng thái thủ công (Khóa phòng, Bảo trì)</p>
                    </div>
                    <button onClick={closeCalendarModal} className="text-white hover:text-red-300 text-3xl leading-none">&times;</button>
                </div>

                {/* Modal Body: Lịch */}
                <div className="p-6">
                    <div className="flex justify-center gap-4 mb-6 text-sm border-b pb-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border rounded"></div> Trống</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div> Khách Đang Ở</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div> Khóa/Đã Đặt</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div> Đang Bảo Trì</div>
                    </div>

                    <div className="grid grid-cols-7 gap-3 mb-6">
                        {renderAdminCalendar()}
                    </div>
                </div>

                {/* Modal Footer: Nút Save */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0 border-t">
                    <button onClick={closeCalendarModal} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-100 font-medium transition">
                        Đóng (Hủy thay đổi)
                    </button>
                    <button
                        onClick={saveCalendarStatus}
                        disabled={isUpdatingCalendar || !syncingDate}
                        className={`px-5 py-2.5 rounded-lg text-white font-bold transition flex items-center gap-2 
                                  ${!syncingDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                    >
                        {isUpdatingCalendar ? 'Đang đồng bộ DB...' : '💾 Lưu thay đổi lịch'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}