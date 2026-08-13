import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Style giao diện của trình soạn thảo

// 🟢 CHỐT CHẶN SỬA LỖI: Đưa cấu hình thanh công cụ ra ngoài Component
// Điều này giúp ReactQuill không bị sập (trắng màn hình) mỗi khi mở Modal
const modules = {
  toolbar: [
    [{'font': []}, {'size': ['small', false, 'large', 'huge']}], // Font chữ và Cỡ chữ
    [{'align': []}], // Canh lề (trái, giữa, phải, đều)
    [{'header': [1, 2, 3, false]}],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image', 'video'],
    ['clean'] // Nút xóa định dạng
  ],
}

export default function IntroductionManager() {
  const [introductions, setIntroductions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchIntroductions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/introductions/`);
      const data = await res.json();
      setIntroductions(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };

  useEffect(() => { fetchIntroductions(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    const payload = { title, content, is_active: isActive };
    const url = editingId
      ? `${import.meta.env.VITE_API_BASE_URL}/introductions/${editingId}/`
      : `${import.meta.env.VITE_API_BASE_URL}/introductions/`;

    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Đã lưu Lời giới thiệu!");
        setIsModalOpen(false);
        resetForm();
        fetchIntroductions();
      } else {
        alert("Không thể lưu. Vui lòng kiểm tra lại!");
      }
    } catch (err) { alert("Lỗi kết nối Server!"); }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/introductions/${id}/`, {
          method: 'DELETE',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (res.ok) fetchIntroductions();
      } catch (err) { alert("Lỗi kết nối Server!"); }
    }
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setIsActive(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Lời giới thiệu</h1>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
          + Viết bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {introductions.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-xl shadow border flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-green-800">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Trạng thái: {item.is_active ? '🟢 Đang hiển thị' : '🔴 Ẩn'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => openEditModal(item)} className="text-blue-600 font-bold hover:underline">Sửa bài</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
            </div>
          </div>
        ))}
        {introductions.length === 0 && <div className="text-gray-500 bg-white p-8 rounded-xl shadow">Chưa có bài viết giới thiệu nào.</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Sửa bài viết' : 'Viết Lời giới thiệu mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-3xl font-bold leading-none">&times;</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Tiêu đề bài viết</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" placeholder="Ví dụ: Về Hoàng Hân Farmstay..." />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Nội dung (Có thể chèn ảnh/video từ thanh công cụ)</label>
                <div className="bg-white">
                  <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-64 mb-12" />
                </div>
              </div>

              <div className="flex items-center mt-8 p-3 bg-gray-50 border rounded-lg">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 mr-3 accent-blue-600" />
                <label htmlFor="isActive" className="font-bold text-gray-700 cursor-pointer">Hiển thị bài viết này trên Trang chủ</label>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-200 rounded font-bold hover:bg-gray-300 transition">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow-md hover:bg-blue-700 transition">Lưu bài viết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}