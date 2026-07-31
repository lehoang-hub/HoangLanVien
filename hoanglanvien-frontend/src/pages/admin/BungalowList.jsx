import { useState, useEffect } from 'react';

export default function BungalowList() {
  const [bungalows, setBungalows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    price: '',
    status: 'Trống',
    availableFrom: '',
    availableTo: ''
  });

  // ==========================================
  // 1. LẤY DANH SÁCH TỪ LARAVEL KHI MỞ TRANG (READ)
  // ==========================================
  const fetchBungalows = () => {
    fetch('http://localhost:8000/api/admin/bungalows')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Lỗi Server: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Đảm bảo dữ liệu nhận được luôn là một mảng trước khi đưa vào state
        if (Array.isArray(data)) {
          setBungalows(data);
        } else {
          setBungalows([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu API:", err);
        setBungalows([]); // Ép về mảng rỗng để hàm .map() không bị sập
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBungalows();
  }, []);

  // Mở form Thêm mới
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({ name: '', capacity: '', price: '', status: 'Trống', availableFrom: '', availableTo: '' });
    setIsModalOpen(true);
  };

  // Mở form Sửa
  // Mở form Sửa
  const handleOpenEdit = (room) => {
    setEditId(room.id);
    
    // Dịch trạng thái từ DB sang Tiếng Việt cho Form
    let vnStatus = 'Trống';
    if (room.status === 'maintenance') vnStatus = 'Bảo trì';
    if (room.status === 'inactive') vnStatus = 'Đang sử dụng';

    setFormData({
      name: room.name,
      capacity: room.capacity || '',
      price: room.base_price || 0, // Sửa thành base_price
      status: vnStatus, 
      availableFrom: room.available_from ? room.available_from.split('T')[0] : '',
      availableTo: room.available_to ? room.available_to.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  // ==========================================
  // 2. XÓA PHÒNG QUA API (DELETE)
  // ==========================================
  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${name}" không?`)) {
      fetch(`http://localhost:8000/api/admin/bungalows/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      })
      .then(res => res.json())
      .then(() => {
        alert("Đã xóa phòng thành công!");
        fetchBungalows(); // Gọi lại danh sách mới
      })
      .catch(err => console.error("Lỗi khi xóa:", err));
    }
  };

  // ==========================================
  // 3. THÊM MỚI VÀ CẬP NHẬT QUA API (CREATE / UPDATE)
  // ==========================================
  const handleSaveRoom = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert("Vui lòng nhập Tên phòng và Giá phòng!");
      return;
    }

    // Chuyển đổi key từ camelCase (React) sang snake_case (Laravel Database)
    const payload = {
      name: formData.name,
      capacity: formData.capacity,
      price: formData.price,
      status: formData.status,
      available_from: formData.availableFrom || null,
      available_to: formData.availableTo || null
    };

    const url = editId 
      ? `http://localhost:8000/api/admin/bungalows/${editId}` 
  : 'http://localhost:8000/api/admin/bungalows';          // Nếu không -> Gọi API thêm mới

    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json();
      // BẮT LỖI TẠI ĐÂY: Nếu server Laravel trả về lỗi (res.ok = false)
      if (!res.ok) {
        throw new Error(data.message || "Dữ liệu không hợp lệ hoặc máy chủ lỗi!");
      }
      return data;
    })
    .then(data => {
      alert(editId ? "Cập nhật thành công!" : "Thêm phòng mới thành công!");
      setIsModalOpen(false);
      fetchBungalows(); // Tải lại danh sách sau khi lưu
    })
    .catch(err => {
      // Hiển thị lỗi rõ ràng ra màn hình để biết đường sửa
      console.error("Lỗi khi lưu phòng:", err);
      alert("Lưu thất bại: " + err.message);
    });
    };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Bungalow</h1>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
          + Thêm phòng mới
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="px-6 py-4 border-b font-semibold">Tên phòng</th>
              <th className="px-6 py-4 border-b font-semibold">Giá / Đêm</th>
              <th className="px-6 py-4 border-b font-semibold">Trạng thái</th>
              <th className="px-6 py-4 border-b font-semibold">Lịch trống</th>
              <th className="px-6 py-4 border-b font-semibold text-right">Hành động</th>
            </tr>
          </thead>
         <tbody>
            {!Array.isArray(bungalows) || bungalows.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">Chưa có dữ liệu phòng.</td></tr>
            ) : (
              bungalows.map((room) => {
                // Dịch trạng thái sang tiếng Việt
                let vnStatus = 'Trống';
                if (room.status === 'maintenance') vnStatus = 'Bảo trì';
                if (room.status === 'inactive') vnStatus = 'Đang sử dụng';

                return (
                  <tr key={room.id} className="hover:bg-gray-50 border-b transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{room.name}</p>
                      <p className="text-xs text-gray-500">Sức chứa: {room.capacity}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {/* Sửa thành base_price */}
                      {Number(room.base_price).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                        room.status === 'available' ? 'bg-green-100 text-green-800 border-green-200' 
                        : room.status === 'inactive' ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {vnStatus}
                      </span>
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                      {room.available_from && room.available_to ? (
                        <span className="font-medium text-gray-800">
                          {new Date(room.available_from).toLocaleDateString('vi-VN')} - {new Date(room.available_to).toLocaleDateString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa thiết lập</span>
                      )}

                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleOpenEdit(room)} className="text-blue-600 hover:underline">Sửa</button>
                      <button onClick={() => handleDelete(room.id, room.name)} className="text-red-600 hover:underline">Xóa</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editId ? 'Sửa thông tin Bungalow' : 'Thêm Bungalow mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSaveRoom} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
                  <input type="text" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá mỗi đêm (VNĐ) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" required />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Trạng thái & Lịch trống</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
                      <option value="Trống">Trống (Sẵn sàng)</option>
                      <option value="Đang sử dụng">Đang sử dụng (Kín)</option>
                      <option value="Bảo trì">Bảo trì / Dọn dẹp</option>
                    </select>
                  </div>
                  
                  <div className={formData.status !== 'Trống' ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trống từ ngày</label>
                    <input type="date" value={formData.availableFrom} onChange={(e) => setFormData({...formData, availableFrom: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" />
                  </div>
                  <div className={formData.status !== 'Trống' ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input type="date" value={formData.availableTo} onChange={(e) => setFormData({...formData, availableTo: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editId ? 'Cập nhật phòng' : 'Lưu phòng mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}