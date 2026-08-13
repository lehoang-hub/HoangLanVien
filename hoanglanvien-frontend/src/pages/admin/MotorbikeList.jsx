import { useState, useEffect } from 'react';

export default function MotorbikeList() {
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMotorbike, setSelectedMotorbike] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    base_price: '',
    description: '',
    status: 'Trống', // Hiển thị tiếng Việt trên UI
    availableFrom: '',
    availableTo: '',
    images: [],
    dailyStatus: {}
  });

  const fetchMotorbikes = () => {
    // Đã thêm dấu / ở cuối
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/`)
      .then(res => res.json())
      .then(data => {
        const motorbikeList = Array.isArray(data) ? data : (data.data || data.motorbikes || []);
        setMotorbikes(motorbikeList);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu:", err);
        setMotorbikes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMotorbikes();
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

  const handleOpenEdit = (bike) => {
    setEditId(bike.id);
    let vnStatus = 'Trống';
    if (bike.status === 'maintenance') vnStatus = 'Bảo trì';
    if (bike.status === 'occupied' || bike.status === 'inactive') vnStatus = 'Đang sử dụng';

    let minDate = '';
    let maxDate = '';
    let statusObj = {};

    try {
      statusObj = typeof bike.daily_status === 'string' ? JSON.parse(bike.daily_status) : (bike.daily_status || {});
      const dates = Object.keys(statusObj).sort();
      if (dates.length > 0) {
        minDate = dates[0];
        maxDate = dates[dates.length - 1];
      }
    } catch (e) {}

    setFormData({
      name: bike.name,
      license_plate: bike.license_plate || '',
      base_price: bike.base_price || '',
      description: bike.description || '',
      status: vnStatus,
      availableFrom: minDate,
      availableTo: maxDate,
      images: [],
      dailyStatus: statusObj
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (bike) => {
   setSelectedMotorbike(bike);
    setIsDetailModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();

    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
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

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('license_plate', formData.license_plate);
    dataToSend.append('description', formData.description);

    // Ép kiểu số cho giá tiền để tránh lỗi DB
    dataToSend.append('base_price', parseFloat(formData.base_price));

    // SỬA LỖI: Dịch trạng thái Tiếng Việt sang Tiếng Anh cho Database
    let apiStatus = 'available';
    if (formData.status === 'Bảo trì') apiStatus = 'maintenance';
    if (formData.status === 'Đang sử dụng') apiStatus = 'occupied';
    dataToSend.append('status', apiStatus);

    if (formData.availableFrom) dataToSend.append('available_from', formData.availableFrom);
    if (formData.availableTo) dataToSend.append('available_to', formData.availableTo);

    if (formData.dailyStatus && Object.keys(formData.dailyStatus).length > 0) {
      dataToSend.append('daily_status', JSON.stringify(formData.dailyStatus));
    }

    if (formData.images && formData.images.length > 0) {
      for (let i = 0; i < formData.images.length; i++) {
        const compressedFile = await compressImage(formData.images[0]);
        dataToSend.append('image', compressedFile);
      }
    }

    // SỬA LỖI: Cập nhật URL chuẩn RESTful (Có dấu / ở cuối, không có chữ update)
    let url = editId
      ? `${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/${editId}/`
      : `${import.meta.env.VITE_API_BASE_URL}/admin/motorbikes/`;

    // SỬA LỖI: Dùng PUT khi cập nhật, POST khi thêm mới
    let requestMethod = editId ? 'PUT' : 'POST';
    const token = localStorage.getItem('adminToken');

    fetch(url, {
      method: requestMethod,
      headers: {
        'Accept': 'application/json',
        // 2. THÊM DÒNG AUTHORIZATION NÀY VÀO ĐỂ VƯỢ QUA BẢO MẬT CỦA DJANGO
        'Authorization': `Bearer ${token}`
      },
      body: dataToSend
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || JSON.stringify(data));
        return data;
      })
      .then(() => {
        alert(editId ? "Cập nhật xe máy thành công!" : "Thêm xe máy mới thành công!");
        setIsModalOpen(false);
        fetchMotorbikes();
      })
      .catch(err => {
        console.error(err);
        alert("Lưu thất bại: Hãy kiểm tra Console để xem chi tiết lỗi từ Django");
      });
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
            <option value="booked">⚪ Đã đặt (Chưa nhận xe)</option>
            <option value="occupied">🟢 Khách đang thuê</option>
            <option value="maintenance">🔴 Xe đang bảo dưỡng</option>
          </select>
        </div>
      );
      curr.setDate(curr.getDate() + 1);
    }
    return <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">{elements}</div>;
  };

  const renderDetailCalendar = () => {
    if (!selectedMotorbike) return null;

    let dailyMap = {};
    let dates = [];
    try {
      dailyMap = typeof selectedMotorbike.daily_status === 'string'
        ? JSON.parse(selectedMotorbike.daily_status)
        : (selectedMotorbike.daily_status || {});
      dates = Object.keys(dailyMap).sort();
    } catch (e) {}

    if (dates.length === 0) {
      return <p className="text-gray-500 italic mt-4">Xe này chưa thiết lập lịch.</p>;
    }

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const days = [];

    let curr = new Date(start);
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const status = dailyMap[dateStr] || 'available';

      let statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      let statusText = 'Trống';

      if (status === 'booked') { statusClass = 'bg-gray-200 text-gray-700 border-gray-300'; statusText = 'Đã đặt'; }
      else if (status === 'occupied') { statusClass = 'bg-green-100 text-green-800 border-green-300'; statusText = 'Đang thuê'; }
      else if (status === 'maintenance') { statusClass = 'bg-red-100 text-red-800 border-red-300'; statusText = 'Bảo trì'; }

      days.push(
        <div key={dateStr} className={`p-3 rounded-lg border text-center font-semibold ${statusClass}`}>
          <div className="text-sm">{dateStr}</div>
          <div className="text-xs uppercase mt-1 font-bold">{statusText}</div>
        </div>
      );
      curr.setDate(curr.getDate() + 1);
    }
    return <div className="grid grid-cols-4 gap-3 mt-4">{days}</div>;
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Xe máy</h1>
        <button
          onClick={() => {
            setEditId(null);
            setFormData({
              name: '',
              license_plate: '',
              base_price: '',
              description: '',
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
          + Thêm xe mới
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="p-3 text-sm font-bold text-gray-700 uppercase">Hình ảnh</th>
              <th className="p-3 text-sm font-bold text-gray-700 uppercase">Tên xe & Biển số</th>
              <th className="p-3 text-sm font-bold text-gray-700 uppercase">Giá / Ngày</th>
              <th className="p-3 text-sm font-bold text-gray-700 uppercase">Lịch trống</th>
              <th className="p-3 text-sm font-bold text-gray-700 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {motorbikes.map((bike) => {

              // 1. BỘ QUÉT ẢNH THÔNG MINH (Xử lý mọi định dạng dữ liệu từ Django)
              const getActualImage = (bikeData) => {
                let source = bikeData.image || bikeData.images || bikeData.thumbnail;
                if (!source) return null;

                // Nếu là chuỗi JSON (ví dụ: '["/media/anh.jpg"]') thì dịch ngược lại
                if (typeof source === 'string' && (source.startsWith('[') || source.startsWith('{'))) {
                  try { source = JSON.parse(source); } catch (e) {}
                }

                // Nếu là mảng nhiều ảnh, lấy ảnh đầu tiên
                if (Array.isArray(source) && source.length > 0) source = source[0];
                if (!source) return null;

                // Bóc tách URL nếu nó nằm trong một Object
                let imgPath = typeof source === 'object' ? (source.url || source.image || source.file || Object.values(source)[0]) : source;
                if (!imgPath || typeof imgPath !== 'string') return null;

                // Xóa bỏ các ký tự thừa rác (như dấu ngoặc vuông, ngoặc kép) nếu có
                imgPath = imgPath.replace(/['"\[\]]/g, '');

                if (imgPath.startsWith('http')) return imgPath;

                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                return `${baseUrl}${imgPath.startsWith('/') ? imgPath : `/${imgPath}`}`;
              };

              const actualImage = getActualImage(bike);

              return (
                <tr key={bike.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {/* 2. Cập nhật lại thẻ hiển thị ảnh */}
                    {actualImage ? (
                      <img
                        src={actualImage}
                        alt={bike.name}
                        className="w-16 h-12 object-cover rounded-md border border-gray-200"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Loi+Anh'; }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">Chưa có ảnh</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 text-base">{bike.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Biển số: {bike.license_plate || 'Chưa cập nhật'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    {Number(bike.base_price).toLocaleString()} đ
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(() => {
                      let minDate = '';
                      let maxDate = '';
                      try {
                        const statusObj = typeof bike.daily_status === 'string'
                          ? JSON.parse(bike.daily_status)
                          : (bike.daily_status || {});
                        const dates = Object.keys(statusObj).sort();
                        if (dates.length > 0) {
                          minDate = dates[0];
                          maxDate = dates[dates.length - 1];
                        }
                      } catch (e) {}

                      return minDate && maxDate ? (
                        <span>{new Date(minDate).toLocaleDateString('vi-VN')} - {new Date(maxDate).toLocaleDateString('vi-VN')}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa thiết lập</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => handleOpenDetail(bike)} className="text-green-600 hover:underline font-medium">Chi tiết</button>
                    <button onClick={() => handleOpenEdit(bike)} className="text-blue-600 hover:underline font-medium">Sửa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editId ? "Sửa thông tin & Lịch trình Motorbike" : "Thêm mới Motorbike"}</h2>
            <form onSubmit={handleSaveRoom} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium mb-1">Tên xe *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
              </div>

             <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Biển số xe (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá / ngày (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hình ảnh Motorbike (Có thể chọn nhiều ảnh)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, images: e.target.files })}
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

      {isDetailModalOpen && selectedMotorbike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-bold">Lịch chi tiết xe: {selectedMotorbike.name}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="flex gap-4 mb-4 text-xs font-semibold">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border rounded">🟡 Trống</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">⚪ Đã đặt (Chưa nhận xe)</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">🟢 Khách đang sử dụng</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">🔴 Xe đang bảo dưỡng</span>
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