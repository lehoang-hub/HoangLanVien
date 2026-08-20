import { useState, useEffect } from 'react';

export default function HeroManager() {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Lấy danh sách ảnh hiện tại (Lọc bằng video_url)
  const fetchImages = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries/`)
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || []);
        // 🟢 Thay đổi bộ lọc ở đây
        setImages(items.filter(item => item.video_url === 'hero'));
      })
      .catch(err => console.error("Lỗi tải ảnh:", err));
  };

  useEffect(() => { fetchImages(); }, []);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('sliderInput');
    const files = fileInput.files;

    if (!files || files.length === 0) return alert("Vui lòng chọn ít nhất 1 ảnh!");

    setIsUploading(true);
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('title', `Banner_${new Date().getTime()}_${i}`);
        formData.append('file_path', file);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          successCount++;
        } else if (response.status === 401) {
          alert("Phiên đăng nhập Admin đã hết hạn. Vui lòng Đăng nhập lại!");
          setIsUploading(false);
          return;
        } else {
          errorCount++;
          try {
            const errData = await response.json();
            alert(`Lỗi khi up ảnh thứ ${i + 1}: \n${errData.detail}`);
          } catch(err) { console.error(err); }
        }
        await sleep(400);
      }

      if (errorCount > 0) {
        alert(`Hoàn tất! Thành công: ${successCount} ảnh. Bị lỗi: ${errorCount} ảnh.`);
      } else {
        alert(`Tuyệt vời! Đã tải lên thành công trọn vẹn ${successCount} ảnh.`);
        fileInput.value = "";
      }
      fetchImages();

    } catch (error) {
      alert("Lỗi đường truyền hoặc mất kết nối tới Server.");
    }
    setIsUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi Slider trang chủ?")) return;
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchImages();
      else alert("Xóa không thành công.");
    } catch (error) {
      alert("Lỗi kết nối tới Server.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Ảnh bìa (Slider Trang chủ)</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-700 mb-4">Thêm ảnh mới vào Slider</h2>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-600 mb-2">Quét chọn nhiều file ảnh</label>
            <input id="sliderInput" type="file" accept="image/*" multiple className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
          </div>
          <button type="submit" disabled={isUploading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition disabled:opacity-50">
            {isUploading ? 'Đang Upload...' : `Upload Ảnh`}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-10">Trang chủ đang dùng ảnh mặc định.</p>
        ) : (
          images.map((img) => {
            const imgUrl = img.file_path && img.file_path.startsWith('http') ? img.file_path : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}${img.file_path}`;
            return (
              <div key={img.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                <div className="h-40 overflow-hidden">
                  <img src={imgUrl} alt="Slider" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 px-2 py-1 bg-white rounded border">Hiển thị Trang chủ</span>
                  <button onClick={() => handleDelete(img.id)} className="text-red-500 hover:text-white hover:bg-red-500 font-bold px-3 py-1 rounded text-sm transition">Xóa</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}