import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Home() {
  const navigate = useNavigate();
  const [intro, setIntro] = useState(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  // STATE CHO BANNER SLIDER (ẢNH HERO)
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // STATE CHO PHẦN ĐÁNH GIÁ (REVIEWS)
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    // 1. Tải Ảnh Banner (Slider) từ Galleries
    fetch(`${import.meta.env.VITE_API_BASE_URL}/galleries/`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const images = Array.isArray(data) ? data : (data.results || []);
        // Lọc ảnh Slider dựa vào chữ 'hero' ở cột video_url
        const heroImgs = images.filter(img => img.video_url === 'hero');

        if (heroImgs.length > 0) {
          setHeroImages(heroImgs);
        } else {
          setHeroImages([{ id: 'default', file_path: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2070&auto=format&fit=crop' }]);
        }
      })
      .catch(err => console.error("Lỗi tải Banner:", err));

    // 2. Tải Lời giới thiệu
    fetch(`${import.meta.env.VITE_API_BASE_URL}/introductions/`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const allItems = Array.isArray(data) ? data : (data.results || []);
        const activeIntro = allItems.find(item => item.is_active);
        setIntro(activeIntro);
      })
      .catch(err => console.error("Lỗi tải Lời giới thiệu:", err));

    // 3. Tải danh sách Đánh giá
    fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setReviews(data.reviews || [])
      })
      .catch(err => console.error("Lỗi tải đánh giá:", err));

    // 4. Kiểm tra quyền Đánh giá
    const token = localStorage.getItem('userToken');
    if (token) {
      setIsLoggedIn(true);
      fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/check-eligibility/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.eligible) setCanReview(true);
      })
      .catch(err => console.error("Lỗi kiểm tra quyền đánh giá:", err));
    }
  }, []);

  // Thiết lập vòng lặp 10 giây cho Slide ảnh Banner
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 10000); // 10,000 ms = 10 giây
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      alert("Vui lòng chọn đầy đủ Ngày nhận và Ngày trả phòng!");
      return;
    }
    if (checkIn > checkOut) {
      alert("Ngày trả phòng phải bằng hoặc sau Ngày nhận phòng!");
      return;
    }
    navigate(`/bungalows?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`);
  };

  const renderStars = (activeCount, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <svg key={star} onClick={() => interactive && setRating(star)} className={`w-6 h-6 ${interactive ? 'cursor-pointer transition hover:scale-110' : ''} ${star <= activeCount ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div>
      <SEO title="Trang chủ" description="Hoàng Hân FarmStay - Nơi Bình Yên Gọi Tên." url="https://hoanghanfarmstay.com" />

      {/* HERO SECTION VỚI AUTO SLIDER */}
      <div className="relative h-[80vh] flex items-center justify-center bg-gray-900 overflow-hidden">
        {/* Lớp nền đen để khi ảnh thu nhỏ (object-contain) thì viền sẽ có màu đen sang trọng */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>

        {heroImages.map((img, index) => {
          const isDefault = img.id === 'default';
          const imgUrl = isDefault ? img.file_path :
            (img.file_path.startsWith('http') ? img.file_path : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}${img.file_path.startsWith('/') ? img.file_path : `/${img.file_path}`}`);

          return (
            <img
              key={img.id}
              src={imgUrl}
              alt="Farmstay Background"
              /* 🟢 ĐÃ SỬA: Thay object-cover thành object-contain để hiển thị 100% kích thước ảnh gốc */
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          );
        })}

        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Nơi Bình Yên Gọi Tên
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Trốn khỏi ồn ào phố thị, tận hưởng không gian thiên nhiên trong lành và những căn bungalow ấm cúng tại Hoàng Hân FarmStay.
          </p>
          <Link to="/bungalows" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-lg font-bold px-8 py-3 rounded-full transition shadow-xl inline-block">
            Khám phá phòng nghỉ
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto -mt-10 relative z-30 bg-white rounded-xl shadow-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày nhận phòng</label>
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày trả phòng</label>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số khách</label>
          <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500 bg-white">
            <option value="2">2 người lớn</option>
            <option value="4">4 người lớn</option>
            <option value="6">Gia đình (Tối đa 6)</option>
          </select>
        </div>
        <button onClick={handleSearch} className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 rounded-lg transition mt-4 md:mt-0">
          Kiểm tra phòng
        </button>
      </div>

      {/* Lời giới thiệu */}
      {intro && (
        <section className="py-20 bg-gray-50 mt-10">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-10">{intro.title}</h2>
            <div
              className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed break-words overflow-hidden [&_img]:max-w-[66%] [&_img]:mx-auto [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6 [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify"
              dangerouslySetInnerHTML={{ __html: intro.content }}
            />
          </div>
        </section>
      )}

      {/* SECTION ĐÁNH GIÁ (REVIEWS) */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Khách hàng nói gì về chúng tôi?</h2>
          {reviews.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-2 mb-12">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-gray-800">
                  {(reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <div className="flex flex-col">
                  {renderStars(Math.round(reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length))}
                  <span className="text-sm text-gray-500 font-medium">Dựa trên {reviews.length} đánh giá</span>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 italic">Chưa có đánh giá nào.</div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                  {renderStars(rev.rating)}
                  <p className="text-gray-700 mt-4 mb-6 italic flex-1">"{rev.comment}"</p>
                  <div className="flex items-center gap-3 border-t pt-4">
                    <div className="w-10 h-10 bg-green-200 text-green-800 font-bold rounded-full flex items-center justify-center uppercase">
                      {rev.user_name ? rev.user_name.charAt(0) : 'K'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{rev.user_name || 'Khách hàng'}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Đã trải nghiệm dịch vụ
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="h-20"></div>
    </div>
  );
}