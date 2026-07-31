import { useState, useEffect } from 'react';

export default function DrinkList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drinks, setDrinks] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', category: 'Nước hoa quả', price: '', description: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchDrinks = () => {
    fetch('http://localhost:8000/api/admin/menu-items?type=drink')
      .then(res => res.json())
      .then(data => setDrinks(data))
      .catch(err => console.error("Lỗi lấy dữ liệu:", err));
  };

  useEffect(() => { fetchDrinks(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('type', 'drink');
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await fetch('http://localhost:8000/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      if (response.ok) {
        alert("Thêm đồ uống thành công!");
        setIsModalOpen(false);
        setFormData({ name: '', category: 'Nước hoa quả', price: '', description: '' });
        setImageFile(null);
        fetchDrinks();
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Vui lòng kiểm tra lại!"));
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đồ uống (Drink)</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow font-bold">
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
            </tr>
          </thead>
          <tbody>
            {drinks.map(item => (
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
            {drinks.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Chưa có đồ uống nào. Hãy thêm mới!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Thêm Đồ uống mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đồ uống <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 bg-white">
                    <option value="Nước hoa quả">Nước hoa quả</option>
                    <option value="Cà phê">Cà phê</option>
                    <option value="Trà & Thảo mộc">Trà & Thảo mộc</option>
                    <option value="Bia & Rượu">Bia & Rượu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán <span className="text-red-500">*</span></label>
                  <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên hình ảnh (JPG, PNG)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => setImageFile(e.target.files[0])} 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-bold">Lưu đồ uống</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}