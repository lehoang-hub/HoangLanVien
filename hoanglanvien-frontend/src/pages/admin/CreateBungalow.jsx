import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateBungalow() {
  const navigate = useNavigate();

  // 1. Nhận diện chế độ Sửa thông qua ID trên URL
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // 2. Khôi phục TOÀN BỘ state cho form gốc của bạn
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    base_price: '',
    capacity: '',
    max_capacity: '',
    status: 'available',
    description: '',
    available_from: '',
    available_to: ''
  });

  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(false);

  // 3. Tự động tải dữ liệu cũ lên nếu đang ở chế độ Sửa
  useEffect(() => {
    if (isEditMode) {
      const fetchBungalow = async () => {
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name: data.name || '',
              slug: data.slug || '',
              base_price: data.base_price || '',
              capacity: data.capacity || '',
              max_capacity: data.max_capacity || '',
              status: data.status || 'available',
              description: data.description || '',
              available_from: data.available_from ? data.available_from.split('T')[0] : '',
              available_to: data.available_to ? data.available_to.split('T')[0] : ''
            });
          }
        } catch (error) {
          console.error("Lỗi tải dữ liệu phòng:", error);
        }
      };
      fetchBungalow();
    }
  }, [id, isEditMode]);

  // Tự động tạo Slug từ Tên phòng
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, '-');
    setFormData({ ...formData, name, slug });
  };

  // 4. Xử lý lưu dữ liệu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('adminToken');
    const url = isEditMode
      ? `${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${id}/`
      : `${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/`;

    const method = isEditMode ? 'PATCH' : 'POST';

    // Sử dụng FormData để hỗ trợ upload nhiều ảnh cùng lúc
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        payload.append(key, formData[key]);
      }
    });

    if (images && images.length > 0) {
        // Tạm thời lấy ảnh đầu tiên gán vào cột 'image' của Database
        payload.append('image', images[0]);
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Lưu ý: Không set Content-Type khi dùng FormData, trình duyệt sẽ tự sinh ra boundary
        },
        body: payload
      });

      if (res.ok) {
        alert(isEditMode ? "Cập nhật Bungalow thành công!" : "Thêm Bungalow thành công!");
        navigate('/admin/bungalows');
      } else {
        const errData = await res.json();
        alert("Có lỗi xảy ra: " + JSON.stringify(errData));
      }
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header đúng chuẩn form cũ */}
      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? `Sửa thông tin: ${formData.name}` : 'Thêm Bungalow mới'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isEditMode ? 'Cập nhật lại các thông tin bên dưới cho phòng nghỉ.' : 'Điền đầy đủ thông tin dưới đây để tạo phòng mới.'}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium shadow-sm transition"
        >
          Hủy & Quay lại
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tên & Slug (Giao diện dòng đơn giống ảnh) */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tên Bungalow <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                placeholder="VD: Bungalow VIP Ocean View"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                placeholder="VD: bungalow-vip-ocean-view"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:outline-none text-sm text-gray-500"
              />
            </div>
          </div>

          {/* 3 Cột: Giá - Sức chứa - Sức chứa tối đa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Giá cơ bản / đêm (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required
                placeholder="VD: 1500000"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Sức chứa tiêu chuẩn
              </label>
              <input
                type="number"
                placeholder="VD: 2"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Sức chứa tối đa <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required
                placeholder="VD: 4"
                value={formData.max_capacity}
                onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="available">🟡 Sẵn sàng (Available)</option>
              <option value="maintenance">🔴 Bảo trì (Maintenance)</option>
            </select>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              rows="4"
              placeholder="Mô tả về tiện nghi, view, diện tích..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            ></textarea>
          </div>

          {/* Sẵn sàng từ ngày - đến ngày (Nằm trong border) */}
          <div className="border border-gray-300 rounded-lg p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Sẵn sàng từ ngày
              </label>
              <input
                type="date"
                value={formData.available_from}
                onChange={(e) => setFormData({...formData, available_from: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Sẵn sàng đến ngày
              </label>
              <input
                type="date"
                value={formData.available_to}
                onChange={(e) => setFormData({...formData, available_to: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
            </div>
          </div>

          {/* Hình ảnh Bungalow */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Hình ảnh Bungalow (Có thể chọn nhiều ảnh)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(e.target.files)}
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-6 mt-6 border-t flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium shadow-sm transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : (isEditMode ? '💾 Lưu cập nhật' : 'Tạo Bungalow mới')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}