import { useState, useEffect } from 'react';
import SEO from '../../components/SEO';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/client/galleries/`)
      .then(res => res.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  if (loading) return <div className="text-center py-20 font-bold">Đang tải thư viện...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SEO title="Thư viện Hình ảnh & Video" description="Khám phá không gian thực tế tại Hoàng Hân FarmStay qua những thước phim và hình ảnh sống động." />

      <div className="bg-green-800 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-2">Thư viện Khoảnh khắc</h1>
        <p className="text-green-100">Hình ảnh và video thực tế tại Hoàng Hân FarmStay</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden border">
            {item.type === 'image' ? (
              <div className="h-60">
                <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${item.file_path}`} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video">
                <iframe src={getEmbedUrl(item.video_url)} title={item.title} className="w-full h-full" allowFullScreen></iframe>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-gray-800">{item.title || "Khoảnh khắc tại Hoàng Hân FarmStay"}</h3>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-center text-gray-500 mt-10">Thư viện đang cập nhật nội dung.</p>}
    </div>
  );
}