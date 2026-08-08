import { useState, useEffect } from 'react';

export default function ImageList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Lấy danh sách ảnh từ Database
  const fetchImages = () => {
    fetch('${import.meta.env.VITE_API_BASE_URL}/admin/galleries?type=image')
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(err => console.error("Lỗi tải ảnh:", err));
  };

  useEffect(() => { fetchImages(); }, []);

  // Thêm mới hình ảnh
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Vui lòng chọn file ảnh!");

    const data = new FormData();
    data.append('type', 'image');
    data.append('title', title);
    data.append('file_path', imageFile);

    try {
      const res = await fetch('${import.meta.env.VITE_API_BASE_URL}/admin/galleries', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      if (res.ok) {
        alert("Upload ảnh thành công!");
        setIsModalOpen(false);
        setTitle('');
        setImageFile(null);
        fetchImages();
      } else {
        const errData = await res.json();
        alert("Lỗi: " + (errData.message || "Không thể upload ảnh!"));
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  // Xóa hình ảnh
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries/${id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          alert("Xóa ảnh thành công!");
          fetchImages();
        } else {
          alert("Không thể xóa ảnh!");
        }
      } catch (error) {
        alert("Lỗi kết nối Server!");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hình ảnh</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-bold">
          + Tải ảnh mới lên
        </button>
      </div>
      
      {/* Lưới hiển thị danh sách ảnh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-xl shadow overflow-hidden border border-gray-100 flex flex-col">
            <div className="h-40 bg-gray-200">
              <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${img.file_path}`} alt={img.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <p className="text-sm font-semibold text-gray-800 truncate">{img.title || "Không có tiêu đề"}</p>
              <button onClick={() => handleDelete(img.id)} className="mt-3 text-xs text-red-600 font-bold hover:underline text-left">
                🗑️ Xóa ảnh
              </button>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">Chưa có hình ảnh nào trong hệ thống.</div>
      )}

      {/* MODAL UPLOAD ẢNH */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tải ảnh mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file ảnh (jpg, png) <span className="text-red-500">*</span></label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  required 
                  onChange={(e) => setImageFile(e.target.files[0])} 
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề / Mô tả ảnh</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none" 
                  placeholder="VD: Khách hàng check-in đồi chè" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Upload ảnh</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}