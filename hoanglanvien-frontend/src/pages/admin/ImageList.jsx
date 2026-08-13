import { useState, useEffect } from 'react';

export default function ImageList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  const fetchImages = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/?type=image`)
      .then(res => {
        if (!res.ok) throw new Error("API Not Found");
        return res.json();
      })
     .then(data => {
        const allItems = Array.isArray(data) ? data : (data.results || []);
        const imageOnly = allItems.filter(item => item.type === 'image');
        setImages(imageOnly);
      })
      .catch(err => console.error("Lỗi tải ảnh:", err));
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) return alert("Vui lòng chọn ít nhất 1 file ảnh!");

    const token = localStorage.getItem('adminToken');

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const data = new FormData();
        data.append('type', 'image');
        data.append('title', title || file.name);

        // 🟢 CHIẾN THUẬT GỬI RẢI THẢM: Bao trọn mọi trường hợp tên cột trong Django
        data.append('file_path', file);
        data.append('image', file);
        data.append('file', file);
        data.append('photo', file);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: data
        });

        if (!response.ok) throw new Error("Lỗi khi lưu vào Server");
        return response;
      });

      await Promise.all(uploadPromises);

      alert(`Đã upload thành công ${imageFiles.length} ảnh!`);
      setIsModalOpen(false);
      setTitle('');
      setImageFiles([]);
      fetchImages();

    } catch (error) {
      alert("Lỗi: Server từ chối lưu ảnh. Vui lòng kiểm tra lại đường dẫn API hoặc tên biến trong Django!");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/${id}/`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (res.ok) {
          alert("Xóa ảnh thành công!");
          fetchImages();
        } else alert("Không thể xóa ảnh!");
      } catch (error) { alert("Lỗi kết nối Server!"); }
    }
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/600x400?text=Loi+Anh';
    let urlStr = typeof path === 'object' ? (path.file_path || path.image || path.file || path.url) : path;
    if (typeof urlStr !== 'string' || !urlStr) return 'https://placehold.co/600x400?text=Loi+Anh';

    if (urlStr.startsWith('http')) return urlStr;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
    if (!urlStr.includes('media/')) {
      urlStr = `/media/${urlStr.startsWith('/') ? urlStr.slice(1) : urlStr}`;
    } else {
      urlStr = urlStr.startsWith('/') ? urlStr : `/${urlStr}`;
    }
    return `${baseUrl}${urlStr}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hình ảnh</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-bold">
          + Tải ảnh mới lên
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-xl shadow overflow-hidden border border-gray-100 flex flex-col">
            <div className="h-40 bg-gray-200">
              <img src={getImageUrl(img.file_path || img.image || img.file || img.photo)} alt={img.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <p className="text-sm font-semibold text-gray-800 truncate">{img.title || "Không có tiêu đề"}</p>
              <button onClick={() => handleDelete(img.id)} className="mt-3 text-xs text-red-600 font-bold hover:underline text-left">🗑️ Xóa ảnh</button>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">Chưa có hình ảnh nào trong hệ thống.</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tải ảnh mới (Nhiều file)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file ảnh <span className="text-red-500">*</span></label>
                <input
                  type="file" multiple accept="image/png, image/jpeg, image/webp" required
                  onChange={(e) => setImageFiles(Array.from(e.target.files))}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
                {imageFiles.length > 0 && <p className="text-xs text-green-600 mt-2 font-bold">Đã chọn: {imageFiles.length} file</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề (Chung cho các ảnh)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Để trống sẽ tự lấy tên file gốc" />
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Upload tất cả</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}