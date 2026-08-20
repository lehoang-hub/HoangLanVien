import { useState, useEffect } from 'react';
import SEO from '../../components/SEO';

// 🟢 IMPORT ẢNH NỀN TỪ THƯ MỤC TRONG MÁY
// Thay 'gallery-bg.jpg' bằng đúng tên file ảnh bạn đã lưu trong thư mục assets
import BANNER_IMAGE_URL from '../../assets/picnic.jpg';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/`)
      .then(res => res.json())
      .then(data => {
        const fetchedItems = Array.isArray(data) ? data : (data.results || []);

        // 🟢 TIẾN HÀNH LỌC DỮ LIỆU
        // Chỉ lấy những file KHÔNG ĐƯỢC đánh dấu là 'hero' (Slider trang chủ)
        const galleryItems = fetchedItems.filter(item => item.video_url !== 'hero' && item.type !== 'hero');

        setItems(galleryItems);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const getMediaUrl = (path, isVideo = false) => {
    if (!path) return isVideo ? '' : 'https://placehold.co/600x400?text=Loi+Anh';

    let urlStr = typeof path === 'object' ? (path.file_path || path.image || path.file || path.video || path.url) : path;
    if (typeof urlStr !== 'string' || !urlStr) return isVideo ? '' : 'https://placehold.co/600x400?text=Loi+Anh';

    if (urlStr.startsWith('http')) return urlStr;

    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');

    if (!urlStr.includes('media/')) {
      urlStr = `/media/${urlStr.startsWith('/') ? urlStr.slice(1) : urlStr}`;
    } else {
      urlStr = urlStr.startsWith('/') ? urlStr : `/${urlStr}`;
    }

    return `${baseUrl}${urlStr}`;
  };

  if (loading) return <div className="text-center py-20 font-bold">Đang tải thư viện...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SEO title="Thư viện Hình ảnh & Video" description="Khám phá không gian thực tế tại Hoàng Hân FarmStay qua những thước phim và hình ảnh sống động." />

      {/* 🟢 BANNER NỀN: SỬ DỤNG ẢNH ĐƯỢC IMPORT VÀ CÓ LỚP PHỦ MỜ */}
      <div className="relative bg-green-900 text-white py-24 text-center shadow-inner overflow-hidden">
        {/* Lớp nền ảnh: dùng bg-cover giúp ảnh tự động co lại vừa với khung hình hiện tại */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url('${BANNER_IMAGE_URL}')` }}
        ></div>

        {/* Lớp phủ mờ màu đen để làm nổi bật chữ */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Nội dung chữ được phóng to và làm nổi bật giống các trang khác */}
        <div className="relative z-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Thư viện Khoảnh khắc</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-green-100 px-4 drop-shadow-md">
            Hình ảnh và video thực tế tại Hoàng Hân FarmStay
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border">

            {item.type === 'image' ? (
              <div className="h-48 bg-gray-100">
                <img
                  src={getMediaUrl(item.file_path || item.image || item.file || item.photo, false)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Loi+Anh'; }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-black flex items-center justify-center">
                {item.video_url ? (
                  <iframe src={getEmbedUrl(item.video_url)} title={item.title} className="w-full h-full" allowFullScreen></iframe>
                ) : (
                  getMediaUrl(item.file_path || item.file || item.video, true) ? (
                    <video src={getMediaUrl(item.file_path || item.file || item.video, true)} controls className="w-full h-full object-contain"></video>
                  ) : (
                    <div className="text-gray-500 italic text-sm">Lỗi video</div>
                  )
                )}
              </div>
            )}

            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.title || "Khoảnh khắc tại Hoàng Hân FarmStay"}</h3>
            </div>

          </div>
        ))}
      </div>

      {items.length === 0 && <p className="text-center text-gray-500 mt-10">Thư viện đang cập nhật nội dung.</p>}
    </div>
  );
}