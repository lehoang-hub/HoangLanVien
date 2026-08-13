import { useState, useEffect } from 'react';

export default function VideoList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  const fetchVideos = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/?type=video`)
      .then(res => {
        if (!res.ok) throw new Error("API Not Found");
        return res.json();
      })
      .then(data => {
        const allItems = Array.isArray(data) ? data : (data.results || []);
        const videoOnly = allItems.filter(item => item.type === 'video');
        setVideos(videoOnly);
      })
      .catch(err => console.error("Lỗi tải video:", err));
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!videoUrl && !videoFile) {
      return alert("Vui lòng nhập đường dẫn YouTube hoặc chọn File video để tải lên!");
    }

    const token = localStorage.getItem('adminToken');
    const data = new FormData();
    data.append('type', 'video');
    data.append('title', title || (videoFile ? videoFile.name : 'Video Farmstay'));

    if (videoUrl) data.append('video_url', videoUrl);

    if (videoFile) {
      // 🟢 CHIẾN THUẬT GỬI RẢI THẢM CHO VIDEO
      data.append('file_path', videoFile);
      data.append('file', videoFile);
      data.append('video', videoFile);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: data
      });

      if (res.ok) {
        alert("Thêm Video thành công!");
        setIsModalOpen(false);
        setTitle('');
        setVideoUrl('');
        setVideoFile(null);
        fetchVideos();
      } else {
        alert("Lỗi: Không thể lưu video do Server từ chối! Hãy chắc chắn model Django đang dùng FileField.");
      }
    } catch (error) {
      alert("Lỗi kết nối Server!");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa video này?")) {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/${id}/`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (res.ok) fetchVideos();
        else alert("Không thể xóa video!");
      } catch (error) { alert("Lỗi kết nối Server!"); }
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const getMediaUrl = (path) => {
    // 🟢 SỬA LỖI VIDEO BỊ ĐÓNG BĂNG: Trả về chuỗi rỗng thay vì ảnh giả nếu không có video
    if (!path) return '';

    let urlStr = typeof path === 'object' ? (path.file_path || path.video || path.file || path.url) : path;
    if (typeof urlStr !== 'string' || !urlStr) return '';

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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Video</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">+ Thêm Video</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map(v => (
          <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden border">
            <div className="aspect-video bg-black flex items-center justify-center">
              {v.video_url ? (
                <iframe src={getEmbedUrl(v.video_url)} title={v.title} className="w-full h-full" allowFullScreen></iframe>
              ) : (
                // 🟢 THÊM KIỂM TRA: Chỉ hiển thị thẻ video nếu có đường dẫn hợp lệ
                getMediaUrl(v.file_path || v.file || v.video) ? (
                  <video src={getMediaUrl(v.file_path || v.file || v.video)} controls className="w-full h-full object-contain"></video>
                ) : (
                  <div className="text-gray-500 italic text-sm">Lỗi: Không tìm thấy file video</div>
                )
              )}
            </div>
            <div className="p-4 flex justify-between items-center">
              <p className="font-semibold text-gray-800 truncate flex-1">{v.title || "Video Farmstay"}</p>
              <button onClick={() => handleDelete(v.id)} className="text-sm text-red-600 font-bold hover:underline ml-2">Xóa</button>
            </div>
          </div>
        ))}
      </div>
      {videos.length === 0 && <div className="bg-white p-8 text-center text-gray-500">Chưa có video nào.</div>}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Thêm Video mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cách 1: Nhập link YouTube</label>
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://youtube.com/watch?v=..." disabled={!!videoFile} />
              </div>

              <div className="text-center text-sm font-bold text-gray-400">HOẶC</div>

              <div className="bg-gray-50 p-3 rounded border">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cách 2: Tải file Video lên (MP4)</label>
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700"
                  disabled={!!videoUrl}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề Video</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="VD: Không gian buổi sáng..." />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded font-bold">Lưu Video</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}