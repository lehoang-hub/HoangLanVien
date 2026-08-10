// File: src/pages/admin/CreateBungalow.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hàm đơn giản để tạo slug tự động từ tên (Có thể dùng thư viện slugify nếu muốn)
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Thay thế khoảng trắng bằng -
    .replace(/[^\w-]+/g, '')  // Xóa tất cả các ký tự không phải chữ cái, số, -
    .replace(/--+/g, '-');    // Thay thế nhiều -- bằng một -
};

export default function CreateBungalow() {
  const navigate = useNavigate();

  // --- CẬP NHẬT STATE FORM THEO CẤU TRÚC DB ---
  const [formData, setFormData] = useState({
    name: '',           // varchar(191) - Không NULL
    slug: '',           // varchar(191) - Không NULL
    base_price: '',     // decimal(10,2) - Không NULL (Sửa từ 'price' thành 'base_price')
    capacity: '',       // int - Có NULL
    max_capacity: '',   // int - Không NULL (Thêm trường)
    status: 'available', // varchar(255) - Không NULL (Thêm trường, giá trị default là 'available')
    description: '',    // text - Có NULL
    available_from: '', // date - Có NULL (Thêm trường)
    available_to: '',   // date - Có NULL (Thêm trường)
    // XÓA trường 'bed_type' vì không có trong cấu trúc DB được cung cấp
  });

  // State quản lý file ảnh chính (sẽ lưu vào cột 'image' của bảng bungalows)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // State quản lý trạng thái gửi form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Hàm xử lý thay đổi dữ liệu các ô nhập liệu thông thường
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = { ...formData, [name]: value };

    // Tự động tạo slug khi tên phòng thay đổi và trường slug chưa có dữ liệu hoặc do người dùng sửa
    if (name === 'name' && !formData.slug) {
        updatedFormData.slug = generateSlug(value);
    } else if (name === 'slug') {
        // Cho phép người dùng tự sửa slug nếu muốn, nhưng vẫn sanitize
        updatedFormData.slug = generateSlug(value);
    }

    setFormData(updatedFormData);
  };

  // Hàm xử lý khi chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm xử lý gửi Form (Gọi API POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // --- Validate các trường bắt buộc theo DB ---
    const requiredFields = ['name', 'slug', 'base_price', 'max_capacity', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0 || !imageFile) {
      setError(`Vui lòng điền đầy đủ: ${missingFields.join(', ')} và tải lên Hình ảnh.`);
      setIsSubmitting(false);
      return;
    }

    // --- CHUẨN BỊ DỮ LIỆU FORM (DẠG FormData ĐỂ UPLOAD FILE) ---
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('slug', formData.slug); // Thêm slug
    // Ép kiểu số cho các trường số
    dataToSend.append('base_price', parseFloat(formData.price)); // Sửa tên trường và ép kiểu số thực
    if (formData.capacity) dataToSend.append('capacity', parseInt(formData.capacity)); // Ép kiểu số nguyên
    dataToSend.append('max_capacity', parseInt(formData.max_capacity)); // Thêm trường và ép kiểu số nguyên
    dataToSend.append('status', formData.status); // Thêm status
    dataToSend.append('description', formData.description);
    // Thêm date fields
    if (formData.available_from) dataToSend.append('available_from', formData.available_from);
    if (formData.available_to) dataToSend.append('available_to', formData.available_to);

    // Append file ảnh chính vào trường 'image'
    dataToSend.append('image', imageFile);

    try {
      // --- GỌI API POST ĐẾN DJANGO ---
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/`, {
        method: 'POST',
        body: dataToSend,
        // headers: {
        //   'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        // }
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Lỗi từ Server:', responseData);
        // Hiển thị lỗi đầu tiên nhận được từ Django
        const firstErrorKey = Object.keys(responseData)[0];
        const errorMessage = responseData[firstErrorKey];
        throw new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      }

      alert('Đã thêm Bungalow mới thành công!');
      navigate('/admin/bungalows');

    } catch (err) {
      setError(`Lỗi khi tạo: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Header Form */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Bungalow mới</h1>
          <p className="text-gray-600 mt-1">Điền đầy đủ thông tin dưới đây để tạo phòng mới.</p>
        </div>
        <button
          onClick={() => navigate('/admin/bungalows')}
          className="bg-white hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
        >
          Hủy & Quay lại
        </button>
      </div>

      {/* Hiển thị lỗi (nếu có) */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* --- FORM THÊM MỚI --- */}
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* 1. Tên phòng (varchar(191), Không NULL) */}
          <div className="col-span-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Tên Bungalow <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: Bungalow VIP Ocean View"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
              required
            />
          </div>

          {/* 1a. Slug (varchar(191), Không NULL) - TỰ ĐỘNG TẠO TỪ TÊN */}
          <div className="col-span-2">
            <label htmlFor="slug" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="VD: bungalow-vip-ocean-view"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors bg-gray-50 font-mono text-xs"
              required
            />
          </div>

          {/* 2. Giá cơ bản (decimal(10,2), Không NULL) - SỬA TÊN TRƯỜNG */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="base_price" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Giá cơ bản một đêm (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="base_price"
              name="base_price"
              value={formData.base_price}
              onChange={handleInputChange}
              placeholder="VD: 1500000"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
              required
              min="0"
              step="0.01" // Hỗ trợ decimal
            />
          </div>

          {/* 3. Sức chứa cơ bản (int, Có NULL) */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="capacity" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Sức chứa cơ bản (Người)
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              placeholder="VD: 2"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
              min="1"
            />
          </div>

          {/* 3a. Sức chứa tối đa (int, Không NULL) - THÊM TRƯỜNG */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="max_capacity" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Sức chứa tối đa (Người) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="max_capacity"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleInputChange}
              placeholder="VD: 4"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
              required
              min="1"
            />
          </div>

          {/* 4. Trạng thái (varchar(255), Không NULL, default 'available') - THÊM TRƯỜNG */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors bg-white"
              required
            >
              <option value="available">Sẵn sàng (Available)</option>
              <option value="maintenance">Bảo trì (Maintenance)</option>
              <option value="booked">Đã đặt (Booked)</option>
              <option value="hidden">Ẩn (Hidden)</option>
            </select>
          </div>

          {/* 5. Mô tả phòng (text, Có NULL) */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Mô tả chi tiết
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả về tiện nghi, view, diện tích..."
              rows="4"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
            />
          </div>

          {/* 7. Available From (date, Có NULL) - THÊM TRƯỜNG */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="available_from" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Sẵn sàng từ ngày
            </label>
            <input
              type="date"
              id="available_from"
              name="available_from"
              value={formData.available_from}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
            />
          </div>

          {/* 8. Available To (date, Có NULL) - THÊM TRƯỜNG */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="available_to" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Sẵn sàng đến ngày
            </label>
            <input
              type="date"
              id="available_to"
              name="available_to"
              value={formData.available_to}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-600 transition-colors"
            />
          </div>

          {/* 6. Upload Hình ảnh CHÍNH (varchar(255) 'image', Có NULL) */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Hình ảnh đại diện Bungalow <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col md:flex-row items-start gap-6 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-green-400 transition-colors">

              <div className="w-full md:w-48 h-36 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Tải lên hình ảnh đại diện đẹp nhất của Bungalow. Hỗ trợ JPG, PNG. Dung lượng tối đa 5MB.
                </p>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- NÚT SUBMIT FORM --- */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/bungalows')}
            className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-8 rounded-xl border border-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-lg">🌀</span> Đang tạo...
              </>
            ) : (
              'Tạo Bungalow mới'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}