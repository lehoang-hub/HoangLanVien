import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../../components/SEO';

// 🟢 IMPORT ẢNH TỪ THƯ MỤC TRONG MÁY (Local File)
// Chú ý: Thay 'bungalow.jpg' bằng đúng tên file ảnh bạn đã lưu trong thư mục assets
import BANNER_IMAGE_URL from '../../assets/bungalow.jpg';

export default function Bungalows() {
  const [bungalows, setBungalows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // 🟢 Lấy dữ liệu tìm kiếm từ thanh URL
  const [searchParams] = useSearchParams();
  const checkinParam = searchParams.get('checkin');
  const checkoutParam = searchParams.get('checkout');
  const guestsParam = searchParams.get('guests');

  // Đặt số lượng hiển thị trên mỗi trang là 3
  const itemsPerPage = 3;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/bungalows/`)
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi Server: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setBungalows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu API:", err);
        setBungalows([]);
        setLoading(false);
      });
  }, []);

  const handleViewDetail = (id) => {
    navigate(`/bungalows/${id}`);
  };

  // ==========================================
  // 🟢 LOGIC LỌC TÌM KIẾM (BỘ LỌC KÉP)
  // ==========================================
  const availableRooms = bungalows.filter(room => {
    // 1. Lọc điều kiện bắt buộc: Phòng phải đang mở
    if (room.status !== 'available' && room.status !== 'Trống') return false;

    // 2. Lọc theo sức chứa (Nếu khách hàng có chọn số khách)
    if (guestsParam) {
      const requiredCapacity = parseInt(guestsParam, 10);
      const roomMax = parseInt(room.max_capacity || room.capacity || 0, 10);
      if (roomMax < requiredCapacity) return false; // Loại nếu phòng quá nhỏ
    }

    // 3. Lọc theo thời gian (Bóc tách dữ liệu JSON daily_status)
    if (checkinParam && checkoutParam && room.daily_status) {
      try {
        const dailyMap = JSON.parse(room.daily_status);
        let curr = new Date(checkinParam);
        const end = new Date(checkoutParam);

        while (curr <= end) {
          const year = curr.getFullYear();
          const month = String(curr.getMonth() + 1).padStart(2, '0');
          const day = String(curr.getDate()).padStart(2, '0');
          const localDateStr = `${year}-${month}-${day}`;

          const status = dailyMap[localDateStr] || 'available';
          // Nếu có bất kỳ ngày nào bận -> Loại ngay phòng này khỏi kết quả
          if (status === 'booked' || status === 'occupied' || status === 'maintenance') {
            return false;
          }
          curr.setDate(curr.getDate() + 1);
        }
      } catch (e) {
        console.error("Lỗi đọc lịch trống:", e);
      }
    }
    return true; // Qua được hết bài test thì giữ lại phòng này
  });

  // Logic phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBungalows = availableRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(availableRooms.length / itemsPerPage);

  // 🟢 Component Phân trang tái sử dụng (giống trang Restaurant)
  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-4 mt-12">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          &larr; Trước
        </button>
        <span className="font-semibold text-gray-700">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          Sau &rarr;
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-32 text-xl font-bold text-green-700">Đang tải danh sách phòng...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <SEO title="Danh sách Bungalow" description="..." url="https://hoanglanvien.com/bungalows" />

      {/* 🟢 BANNER NỀN: SỬ DỤNG ẢNH ĐƯỢC IMPORT VÀ CÓ LỚP PHỦ MỜ */}
      <div className="relative bg-green-900 text-white py-24 text-center shadow-inner overflow-hidden">
        {/* Lớp nền ảnh: dùng bg-cover giúp ảnh tự động co lại vừa với khung hình hiện tại */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url('${BANNER_IMAGE_URL}')` }}
        ></div>

        {/* Lớp phủ mờ màu đen để làm nổi bật chữ */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Nội dung chữ */}
        <div className="relative z-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            {checkinParam ? 'Kết quả Tìm kiếm Phòng' : 'Danh sách Bungalow'}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-green-100 px-4 drop-shadow-md">
            {checkinParam
              ? `Hiển thị các phòng trống từ ${checkinParam.split('-').reverse().join('/')} đến ${checkoutParam.split('-').reverse().join('/')} cho ${guestsParam} người.`
              : 'Khám phá các hạng phòng tuyệt đẹp tại Hoàng Hân FarmStay.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

        {/* LƯỚI DANH SÁCH BUNGALOW */}
        {availableRooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-500">Không tìm thấy phòng phù hợp.</h3>
            <p className="text-gray-400 mt-2">Xin lỗi, không có phòng nào thoả mãn lịch trình của bạn. Vui lòng chọn ngày khác.</p>
            {checkinParam && (
              <button onClick={() => navigate('/bungalows')} className="mt-4 text-blue-600 font-bold underline">Xóa bộ lọc & Xem tất cả phòng</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Vòng lặp hiển thị phòng giữ nguyên gốc của bạn */}
              {currentBungalows.map((room) => (
                <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col">
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    {room.image ? (
                      <img src={room.image.startsWith('http') ? room.image : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}${room.image.startsWith('/') ? room.image : `/${room.image}`}`} alt={room.name} className="w-full h-48 object-cover rounded-t-lg" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600&auto=format&fit=crop'; }} />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 italic">Chưa có ảnh</div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-green-700 shadow">
                      👥 Tối đa {room.max_capacity || room.capacity || 2} Khách
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                      {room.description || "Không gian thoáng mát, view đẹp, thích hợp nghỉ dưỡng trọn vẹn tại FarmStay."}
                    </p>

                    <div className="flex justify-between items-end mb-6 border-t border-gray-100 pt-4">
                       <span className="text-sm font-medium text-gray-500">Giá chỉ từ</span>
                       <span className="text-2xl font-bold text-red-600">
                          {Number(room.base_price || room.price || 0).toLocaleString()} đ/đêm
                       </span>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                      <button onClick={() => handleViewDetail(room.id)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        🔍 Xem chi tiết & Đặt phòng
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🟢 HIỂN THỊ NÚT PHÂN TRANG */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}

      </div>
    </div>
  );
}