import { useState, useEffect } from 'react';

export default function FoodList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foods, setFoods] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', category: 'Món chính', price: '', description: ''
  });
  const [imageFile, setImageFile] = useState(null); // State lưu file ảnh

  const fetchFoods = () => {
    fetch('http://localhost:8000/api/admin/menu-items?type=food')
      .then(res => res.json())
      .then(data => setFoods(data))
      .catch(err => console.error("Lỗi lấy dữ liệu:", err));
  };

  useEffect(() => { fetchFoods(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Sử dụng FormData để đính kèm file ảnh lên Server
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('type', 'food');
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await fetch('http://localhost:8000/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Accept': 'application/json' }, // Không để Content-Type khi dùng FormData để trình duyệt tự nhận diện
        body: data
      });

      if (response.ok) {
        alert("Thêm món ăn thành công!");
        setIsModalOpen(false);
        setFormData({ name: '', category: 'Món chính', price: '', description: '' });
        setImageFile(null);
        fetchFoods();
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Vui lòng kiểm tra lại dữ liệu!"));
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đồ ăn (Food)</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow">
          + Thêm món ăn mới
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 font-semibold text-sm">
            <tr>
              <th className="px-6 py-4">Hình ảnh</th>
              <th className="px-6 py-4">Tên món</th>
              <th className="px-6 py-4">Danh mục</th>
              <th className="px-6 py-4">Giá bán</th>
            </tr>
          </thead>
          <tbody>
            {foods.map(item => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">
                  {item.image ? (
                    <img src={`http://localhost:8000/${item.image}`} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <span className="text-xs text-gray-400">Không có</span>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                <td className="px-6 py-4 text-gray-600">{item.category}</td>
                <td className="px-6 py-4 font-bold text-red-600">{Number(item.price).toLocaleString()} đ</td>
              </tr>
            ))}
            {foods.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Chưa có đồ ăn nào. Hãy thêm mới!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Thêm Món ăn mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên món ăn <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-green-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-green-500 focus:outline-none bg-white">
                    <option value="Món chính">Món chính</option>
                    <option value="Khai vị">Khai vị</option>
                    <option value="Tráng miệng">Tráng miệng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                  <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-green-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên hình ảnh (JPG, PNG)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => setImageFile(e.target.files[0])} 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-green-500 focus:outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Lưu món ăn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}