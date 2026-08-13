// File: src/pages/admin/BungalowList.jsx
import { useState, useEffect } from 'react';
// 1. IMPORTuseNavigate ĐỂ ĐIỀU HƯỚNG TRANG (ĐÃ THÊM Ở ĐÂY)
import { useNavigate } from 'react-router-dom';

export default function BungalowList() {
  const [bungalows, setBungalows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // State để xử lý loading khi xóa
  const [isDeleting, setIsDeleting] = useState(null);

  // 2. KHỞI TẠO FUNCTION ĐIỀU HƯỚNG (ĐÃ THÊM Ở ĐÂY)
  const navigate = useNavigate();

  // 1. Tự động gọi API lấy danh sách khi trang vừa tải xong
  const fetchBungalows = async () => {
    setIsLoading(true);
    try {
      // Gọi API Django thông qua biến môi trường
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/`);

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu từ máy chủ');
      }

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

  // 2. Chức năng Xóa Bungalow
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${name}" không? Thao tác này không thể hoàn tác.`)) {
      setIsDeleting(id); // Hiển thị loading trên nút xóa của dòng này
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/bungalows/${id}/`, {
          method: 'DELETE',
          // Nếu API Django yêu cầu Token, bạn cần kẹp vào Header ở đây:
          // headers: {
          //   'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          // }
        });

        if (!response.ok) {
          throw new Error('Xóa không thành công. Vui lòng kiểm tra lại.');
        }

        // Nếu xóa thành công trên server, cập nhật lại state ở giao diện
        setBungalows(bungalows.filter(b => b.id !== id));
        alert('Đã xóa Bungalow thành công.');
      } catch (err) {
        alert(`Lỗi: ${err.message}`);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // 3. Chức năng Sửa
  const handleEdit = (id) => {
    console.log("Điều hướng sang trang sửa phòng ID:", id);
    // Kích hoạt chuyển hướng đến trang Form dùng chung (Upsert Form)
    navigate(`/admin/bungalows/edit/${id}`);
  };

  // 4. CHỨC NĂNG THÊM MỚI - ĐÃ VIẾT ACTION (ĐÃ SỬA Ở ĐÂY)
  const handleAddNew = () => {
    console.log("Đang điều hướng sang trang thêm phòng mới...");
    // Giả sử route của trang tạo mới là /admin/bungalows/create
    navigate('/admin/bungalows/create');
  };

  // Giao diện loading và lỗi
  if (isLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Đang tải danh sách phòng...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 font-medium">Lỗi kết nối API: {error}</div>;
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Header trang Admin */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bungalow</h1>
          <p className="text-gray-600 mt-1">Xem, thêm, sửa và xóa danh sách các phòng nghỉ.</p>
        </div>

        {/* === NÚT THÊM MỚI (CRUD - C) === */}
        <button
          onClick={handleAddNew} // Hàm này giờ sẽ thực hiện chuyển trang
          className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <span>➕</span> Thêm Bungalow mới
        </button>
      </div>

      {/* Bảng danh sách Admin (CRUD - R) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4">ID</th>
                <th scope="col" className="px-6 py-4">Hình ảnh</th>
                <th scope="col" className="px-6 py-4">Tên phòng</th>
                <th scope="col" className="px-6 py-4">Giá (VND)</th>
                <th scope="col" className="px-6 py-4">Sức chứa</th>
                <th scope="col" className="px-6 py-4">Trạng thái</th>
                <th scope="col" className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bungalows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    Chưa có phòng nào. Hãy bấm "Thêm Bungalow mới".
                  </td>
                </tr>
              ) : (
                bungalows.map((room) => {
                  // Bộ quét ảnh thông minh
                  const getImageUrl = (imageSource) => {
                    if (!imageSource) return null;
                    let imgPath = typeof imageSource === 'object' ? (imageSource.url || imageSource.image) : imageSource;
                    if (!imgPath) return null;
                    if (imgPath.startsWith('http')) return imgPath;
                    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                    const safePath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
                    return `${baseUrl}${safePath}`;
                  };

                  const actualImage = getImageUrl(room.image || (room.images && room.images.length > 0 ? room.images[0] : null));

                  return (
                    <tr key={room.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-left">
                      <td className="px-6 py-4 font-mono text-gray-500">{room.id}</td>
                      <td className="px-6 py-4">
                        {actualImage ? (
                          <img
                            src={actualImage}
                            alt={room.name}
                            className="w-16 h-12 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded-md border border-dashed flex items-center justify-center text-[10px] text-gray-500 px-1 text-center">
                            Chưa có ảnh
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{room.name}</td>
                      {/* ĐÃ SỬA: Lấy chính xác base_price từ form thêm mới */}
                      <td className="px-6 py-4 text-red-600 font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(room.base_price || 0)} đ
                      </td>
                      <td className="px-6 py-4">
                        Tiêu chuẩn: {room.capacity || 2} | Tối đa: {room.max_capacity || 'N/A'}
                      </td>
                      {/* ĐÃ SỬA: Thay cột Kiểu giường cũ bằng Trạng thái thực tế */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${room.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {room.status === 'available' ? 'Sẵn sàng' : room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(room.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded border border-blue-200 hover:border-blue-300 bg-blue-50 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(room.id, room.name)}
                            disabled={isDeleting === room.id}
                            className="text-red-600 hover:text-red-800 font-medium py-1 px-3 rounded border border-red-200 hover:border-red-300 bg-red-50 transition-colors disabled:opacity-50"
                          >
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
    </div>
  );
}