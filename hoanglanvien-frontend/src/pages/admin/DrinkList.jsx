import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DrinkList() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drinks, setDrinks] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', category: 'Nước ép', price: '', description: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchDrinks = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const headers = { 'Accept': 'application/json' };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/menu-items/?type=drink`, { headers })
      .then(res => {
        if (res.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('isAdminLoggedIn');
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            navigate('/admin/login');
            throw new Error("Hết hạn đăng nhập");
        }
        if (!res.ok) throw new Error("Lỗi mạng khi tải danh sách");
        return res.json();
      })
      .then(data => setDrinks(Array.isArray(data) ? data : data.results || []))
      .catch(err => console.error("Lỗi lấy dữ liệu:", err));
  };

  useEffect(() => { fetchDrinks(); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Nước ép', price: '', description: '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('type', 'drink');

      const slug = formData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, '-');
      data.append('slug', slug);

      if (!isEditing) {
          data.append('status', 'available');
      }

      if (imageFile) {
        data.append('image', imageFile);
      }

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const headers = { 'Accept': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = isEditing
        ? `${import.meta.env.VITE_API_BASE_URL}/admin/menu-items/${editingId}/`
        : `${import.meta.env.VITE_API_BASE_URL}/admin/menu-items/`;
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: data
      });

      if (response.ok) {
        alert(isEditing ? "Cập nhật đồ uống thành công!" : "Thêm đồ uống thành công!");
        setIsModalOpen(false);
        fetchDrinks();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdminLoggedIn');
        alert("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
        navigate('/admin/login');
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || JSON.stringify(errorData)));
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đồ uống "${name}" không?`)) return;

    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const headers = { 'Accept': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/menu-items/${id}/`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            alert("Xóa thành công!");
            fetchDrinks();
        } else {
            alert("Không thể xóa. Có thể dữ liệu đang được liên kết.");
        }
    } catch (err) {
        alert("Lỗi kết nối Server!");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đồ uống (Drink)</h1>
        <button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow font-medium transition">
          + Thêm đồ uống mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 font-semibold text-sm">
            <tr>
              <th className="px-6 py-4">Hình ảnh</th>
              <th className="px-6 py-4">Tên đồ uống</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Giá bán</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {drinks.length > 0 ? (
              drinks.map(item => (
                <tr key={item.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    {item.image ? (
                      <img
                        src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}${item.image.startsWith('/') ? item.image : `/${item.image}`}`}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded shadow-sm border"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Loi+Anh'; }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">Không có</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 font-bold text-red-600">{Number(item.price).toLocaleString()} đ</td>
                  <td className="px-6 py-4 text-center space-x-3">
                      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium">Sửa</button>
                      <button onClick={() => handleDelete(item.id, item.name)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Chưa có đồ uống nào. Hãy thêm mới!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Cập nhật Đồ uống" : "Thêm Đồ uống mới"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đồ uống <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none bg-white">
                    <option value="Nước ép">Nước ép</option>
                    <option value="Sinh tố">Sinh tố</option>
                    <option value="Cà phê">Cà phê</option>
                    <option value="Trà">Trà</option>
                    <option value="Bia / Rượu">Bia / Rượu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                  <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên hình ảnh</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {isEditing && <p className="text-xs text-gray-400 mt-1 italic">Để trống nếu không muốn thay đổi ảnh.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold shadow-md transition">{isEditing ? "Lưu thay đổi" : "Lưu đồ uống"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}