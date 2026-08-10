import { useState, useEffect } from 'react';

export default function VideoList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Lấy danh sách video từ Database
  const fetchVideos = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries?type=video/`)
      .then(res => res.json())
      .then(data => setVideos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Lỗi tải video:", err));
  };

  useEffect(() => { fetchVideos(); }, []);

  // Thêm mới video
  const handleSave = async (e) => {
    e.preventDefault();
    if (!videoUrl) return alert("Vui lòng nhập đường dẫn Video!");

    try {
      const res = await fetch('${import.meta.env.VITE_API_BASE_URL}/admin/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ type: 'video', title, video_url: videoUrl })
      });

      if (res.ok) {
        alert("Thêm Video thành công!");
        setIsModalOpen(false);
        setTitle('');
        setVideoUrl('');
        fetchVideos();
      } else {
        const errData = await res.json();
        alert("Lỗi: " + (errData.message || "Không thể lưu video!"));
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  // Xóa video
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa video này không?")) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/galleries/${id}/`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          alert("Xóa video thành công!");
          fetchVideos();
        } else {
          alert("Không thể xóa video!");
        }
      } catch (error) {
        alert("Lỗi kết nối Server!");
      }
    }
  };

  // Hàm chuyển đổi link Youtube thông thường sang dạng nhúng (Embed)
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Video</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow font-bold">
          + Thêm link Video mới
        </button>
      </div>
      
      {/* Lưới hiển thị danh sách video */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map(v => (
          <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden border border-gray-100 flex flex-col">
            <div className="aspect-video bg-black">
              <iframe src={getEmbedUrl(v.video_url)} title={v.title} className="w-full h-full" allowFullScreen></iframe>
            </div>
            <div className="p-4 flex justify-between items-center">
              <p className="font-semibold text-gray-800 truncate flex-1">{v.title || "Video Farmstay"}</p>
              <button onClick={() => handleDelete(v.id)} className="text-sm text-red-600 font-bold hover:underline ml-2">Xóa</button>
            </div>
          </div>
        ))}
      </div>
      {videos.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">Chưa có video nào trong hệ thống.</div>
      )}

      {/* MODAL THÊM VIDEO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Thêm Video mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn Video (URL YouTube) <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  required 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-red-500 focus:outline-none text-sm" 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề Video</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-red-500 focus:outline-none text-sm" 
                  placeholder="VD: Khám phá toàn cảnh Farmstay" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Lưu Video</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}