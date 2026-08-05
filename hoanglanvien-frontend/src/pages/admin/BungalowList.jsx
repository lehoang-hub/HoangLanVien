import { useState, useEffect } from 'react';

export default function BungalowList() {
  const [bungalows, setBungalows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    maxCapacity: '',
    price: '',
    status: 'Trống',
    availableFrom: '',
    availableTo: '',
    images: [], 
    dailyStatus: {} 
  });

  const fetchBungalows = () => {
    fetch('http://localhost:8000/api/admin/bungalows')
      .then(res => res.json())
      .then(data => {
        const roomList = Array.isArray(data) ? data : (data.data || data.bungalows || []);
        setBungalows(roomList);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu:", err);
        setBungalows([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBungalows();
  }, []);

  const handleDateChange = (field, value) => {
    let updatedForm = { ...formData, [field]: value };
    
    if (updatedForm.availableFrom && updatedForm.availableTo) {
      const start = new Date(updatedForm.availableFrom);
      const end = new Date(updatedForm.availableTo);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        alert("Khoảng thời gian lịch trống tối đa chỉ được 1 tháng (30 ngày)!");
        return;
      }

      let newDailyStatus = { ...updatedForm.dailyStatus };
      let curr = new Date(start);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        if (!newDailyStatus[dStr]) {
          newDailyStatus[dStr] = 'available';
        }
        curr.setDate(curr.getDate() + 1);
      }
      updatedForm.dailyStatus = newDailyStatus;
    }

    setFormData(updatedForm);
  };

  const handleOpenEdit = (room) => {
    setEditId(room.id);
    let vnStatus = 'Trống';
    if (room.status === 'maintenance') vnStatus = 'Bảo trì';
    if (room.status === 'inactive') vnStatus = 'Đang sử dụng';

    setFormData({
      name: room.name,
      capacity: room.capacity || '',
      maxCapacity: room.max_capacity || '',
      price: room.base_price || 0,
      status: vnStatus, 
      availableFrom: room.available_from ? room.available_from.split('T')[0] : '',
      availableTo: room.available_to ? room.available_to.split('T')[0] : '',
      images: [],
      dailyStatus: room.daily_status ? JSON.parse(room.daily_status) : {}
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  // Hàm lưu dữ liệu (Xử lý nén ảnh Base64 chống lỗi 413 Content Too Large tuyệt đối)
  const handleSaveRoom = async (e) => {
    e.preventDefault();

    // 1. HÀM TỰ ĐỘNG NÉN ẢNH (Giúp giảm ảnh 5MB xuống còn ~200KB, xóa bỏ hoàn toàn lỗi 413)
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Đặt kích thước tối đa để nén
            const MAX_WIDTH = 1200; 
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Nén thành JPEG với chất lượng 70%
            canvas.toBlob((blob) => {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(newFile);
            }, 'image/jpeg', 0.7);
          };
        };
      });
    };

    // 2. CHUẨN BỊ DỮ LIỆU
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('capacity', formData.capacity);
    dataToSend.append('max_capacity', formData.maxCapacity);
    dataToSend.append('base_price', formData.price);
    dataToSend.append('status', formData.status);
    
    if (formData.availableFrom) dataToSend.append('available_from', formData.availableFrom);
    if (formData.availableTo) dataToSend.append('available_to', formData.availableTo);
    
    if (formData.dailyStatus && Object.keys(formData.dailyStatus).length > 0) {
      dataToSend.append('daily_status', JSON.stringify(formData.dailyStatus)); 
    }
    
    // 3. THỰC HIỆN NÉN VÀ ĐÍNH KÈM TẤT CẢ FILE ẢNH
    if (formData.images && formData.images.length > 0) {
      for (let i = 0; i < formData.images.length; i++) {
        // Nén từng ảnh trước khi append vào FormData
        const compressedFile = await compressImage(formData.images[i]);
        dataToSend.append('images[]', compressedFile);
      }
    }
    
    // 4. GỬI REQUEST
    let url = editId 
      ? `http://localhost:8000/api/admin/bungalows/${editId}/update` 
      : `http://localhost:8000/api/admin/bungalows`;

    fetch(url, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json' 
      },
      body: dataToSend
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi máy chủ!");
      return data;
    })
    .then(() => {
      alert(editId ? "Cập nhật phòng thành công!" : "Thêm phòng mới thành công!");
      setIsModalOpen(false);
      fetchBungalows();
    })
    .catch(err => alert("Lưu thất bại: " + err.message));
  };

  const renderEditDailySchedule = () => {
    if (!formData.availableFrom || !formData.availableTo) return null;

    const start = new Date(formData.availableFrom);
    const end = new Date(formData.availableTo);
    const elements = [];

    let curr = new Date(start);
    while (curr <= end) {
      const dStr = curr.toISOString().split('T')[0];
      const currentStatus = formData.dailyStatus[dStr] || 'available';

      elements.push(
        <div key={dStr} className="flex justify-between items-center bg-white p-2 border rounded">
          <span className="text-sm font-medium">{dStr}</span>
          <select 
            value={currentStatus}
            onChange={(e) => {
              setFormData({
                ...formData,
                dailyStatus: { ...formData.dailyStatus, [dStr]: e.target.value }
              });
            }}
            className="border text-xs p-1 rounded bg-gray-50 font-semibold"
          >
            <option value="available">🟡 Trống</option>
            <option value="booked">⚪ Đã đặt (Chưa check-in)</option>
            <option value="occupied">🟢 Khách đang ở</option>
            <option value="maintenance">🔴 Bảo trì</option>
          </select>
        </div>
      );
      curr.setDate(curr.getDate() + 1);
    }
    return <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">{elements}</div>;
  };

  const renderDetailCalendar = () => {
    if (!selectedRoom || !selectedRoom.available_from || !selectedRoom.available_to) {
      return <p className="text-gray-500 italic">Phòng này chưa thiết lập lịch.</p>;
    }

    const start = new Date(selectedRoom.available_from);
    const end = new Date(selectedRoom.available_to);
    const days = [];
    const dailyMap = selectedRoom.daily_status ? JSON.parse(selectedRoom.daily_status) : {};

    let curr = new Date(start);
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const status = dailyMap[dateStr] || 'available';

      let statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      let statusText = 'Trống';

      if (status === 'booked') { statusClass = 'bg-gray-200 text-gray-700 border-gray-300'; statusText = 'Đã đặt'; }
      else if (status === 'occupied') { statusClass = 'bg-green-100 text-green-800 border-green-300'; statusText = 'Đang ở'; }
      else if (status === 'maintenance') { statusClass = 'bg-red-100 text-red-800 border-red-300'; statusText = 'Bảo trì'; }

      days.push(
        <div key={dateStr} className={`p-3 rounded-lg border text-center font-semibold ${statusClass}`}>
          <div className="text-sm">{dateStr}</div>
          <div className="text-xs uppercase mt-1 font-bold">{statusText}</div>
        </div>
      );
      curr.setDate(curr.getDate() + 1);
    }
    return <div className="grid grid-cols-4 gap-3">{days}</div>;
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div>
      {/* Tiêu đề trang và nút Thêm phòng mới */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Bungalow</h1>
        <button 
          onClick={() => {
            setEditId(null);
            setFormData({
              name: '',
              capacity: '',
              maxCapacity: '',
              price: '',
              status: 'Trống',
              availableFrom: '',
              availableTo: '',
              images: [],
              dailyStatus: {}
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow transition"
        >
          + Thêm phòng mới
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="px-6 py-4 border-b">Hình ảnh</th>
              <th className="px-6 py-4 border-b">Tên phòng</th>
              <th className="px-6 py-4 border-b">Giá / Đêm</th>
              <th className="px-6 py-4 border-b">Lịch trống</th>
              <th className="px-6 py-4 border-b text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {bungalows.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50 border-b">
                <td className="px-6 py-4">
                  {room.image ? (
                    <img src={`http://localhost:8000/${room.image}`} alt={room.name} className="w-16 h-12 object-cover rounded border" />
                  ) : (
                    <span className="text-gray-400 italic text-sm">Chưa có ảnh</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{room.name}</p>
                  <p className="text-xs text-gray-500">Sức chứa: {room.capacity}</p>
                </td>
                <td className="px-6 py-4 font-bold text-red-600">
                  {Number(room.base_price).toLocaleString()} đ
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {room.available_from && room.available_to ? (
                    <span>{new Date(room.available_from).toLocaleDateString('vi-VN')} - {new Date(room.available_to).toLocaleDateString('vi-VN')}</span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa thiết lập</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenDetail(room)} className="text-green-600 hover:underline font-medium">Chi tiết</button>
                  <button onClick={() => handleOpenEdit(room)} className="text-blue-600 hover:underline font-medium">Sửa lịch / Trạng thái</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM MỚI / SỬA THÔNG TIN & CHỌN NHIỀU ẢNH */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editId ? "Sửa thông tin & Lịch trình Bungalow" : "Thêm mới Bungalow"}</h2>
            <form onSubmit={handleSaveRoom} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium mb-1">Tên phòng *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>

              {/* Thay thế phần Sức chứa và Giá tiền cũ bằng đoạn chia 3 cột này */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sức chứa *</label>
                  <input 
                    type="text" 
                    value={formData.capacity} 
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                    className="w-full border rounded px-3 py-2" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sức chứa tối đa *</label>
                  <input 
                    type="number" 
                    value={formData.maxCapacity} 
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})} 
                    className="w-full border rounded px-3 py-2" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá / Đêm (VNĐ) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className="w-full border rounded px-3 py-2" 
                    required 
                  />
                </div>
              </div>

              {/* Input chọn nhiều ảnh */}
              <div>
                <label className="block text-sm font-medium mb-1">Hình ảnh Bungalow (Có thể chọn nhiều ảnh)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => setFormData({...formData, images: e.target.files})} 
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50" 
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-sm uppercase mb-2">Khoảng thời gian lịch trống (Tối đa 1 tháng)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Từ ngày</label>
                    <input type="date" value={formData.availableFrom} onChange={(e) => handleDateChange('availableFrom', e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Đến ngày</label>
                    <input type="date" value={formData.availableTo} onChange={(e) => handleDateChange('availableTo', e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>

                {renderEditDailySchedule()}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-200 rounded-lg">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT LỊCH TRỐNG THEO MÀU */}
      {isDetailModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-bold">Lịch chi tiết phòng: {selectedRoom.name}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-500 text-2xl">&times;</button>
            </div>
            
            <div className="flex gap-4 mb-4 text-xs font-semibold">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border rounded">🟡 Trống</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">⚪ Đã đặt (Chưa check-in)</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">🟢 Khách đang ở</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">🔴 Bảo trì</span>
            </div>

            {renderDetailCalendar()}

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}