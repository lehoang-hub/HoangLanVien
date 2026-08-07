import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Motorbikes() {
  // ==========================================
  // 1. STATE QUẢN LÝ DỮ LIỆU
  // ==========================================
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const handleViewDetail = (id) => {
    navigate(`/motorbikes/${id}`);
  };
  const itemsPerPage = 3;

  // ==========================================
  // 2. GỌI API LẤY DỮ LIỆU
  // ==========================================
  useEffect(() => {
    // Đã xóa dòng fetch bị lặp
    fetch('http://localhost:8000/api/admin/motorbikes')
      .then(res => {
        if (!res.ok) {
          console.error("Lỗi mạng HTTP:", res.status);
          throw new Error("Lỗi kết nối API");
        }
        return res.json();
      })
      .then(data => {
        const motorbikeList = Array.isArray(data) ? data : (data.data || data.motorbikes || []);
        setMotorbikes(motorbikeList);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải danh sách xe máy:", err);
        setMotorbikes([]);
        setLoading(false);
      });
  }, []);

  // ==========================================
  // 3. LOGIC PHÂN TRANG (PAGINATION)
  // ==========================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // ĐÃ SỬA: Bỏ đi bộ lọc 'status' cũ của Bungalow, lấy toàn bộ danh sách xe
  const availableMotorbikes = motorbikes; 
  const currentMotorbikes = availableMotorbikes.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPages = Math.ceil(availableMotorbikes.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Màn hình chờ tải dữ liệu
  if (loading) {
    return <div className="text-center py-32 text-xl font-bold text-green-700">Đang tải danh sách xe máy...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <SEO 
        title="Danh sách Xe máy" 
        description="Khám phá các loại xe máy tuyệt vời tại Hoàng Hân FarmStay với mức giá ưu đãi nhất."
        url="https://hoanghanfarmstay.com/motorbikes"
      />

      {/* Banner Tiêu đề */}
      <div className="bg-green-800 text-white py-16 text-center shadow-inner">
        <h1 className="text-4xl font-bold mb-4 drop-shadow-md">Danh sách Xe máy</h1>
        <p className="text-lg max-w-2xl mx-auto text-green-100 px-4">
          Khám phá các loại xe máy tuyệt vời tại Hoàng Hân FarmStay. Lựa chọn phương tiện hoàn hảo cho những cung đường thơ mộng trong kỳ nghỉ của bạn.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* ========================================== */}
        {/* LƯỚI DANH SÁCH XE MÁY                    */}
        {/* ========================================== */}
        {availableMotorbikes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-500">Hiện tại chưa có xe máy nào.</h3>
            <p className="text-gray-400 mt-2">Vui lòng quay lại sau hoặc liên hệ Hotline để được hỗ trợ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentMotorbikes.map((motorbike) => {
              
              // ĐÃ SỬA: Logic tự động bóc tách mảng nhiều ảnh
              let imageUrl = null;
              try {
                const imageList = typeof motorbike.images === 'string' ? JSON.parse(motorbike.images) : (motorbike.images || []);
                if (imageList.length > 0) {
                  imageUrl = `http://localhost:8000/${imageList[0].url || imageList[0]}`;
                }
              } catch (e) {}

              return (
                <div key={motorbike.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col">
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    
                    {imageUrl ? (
                      <img 
                          src={imageUrl} 
                          alt={motorbike.name} 
                          className="w-full h-48 object-cover rounded-t-lg" 
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 italic">
                          Chưa có ảnh
                      </div>
                    )}
                    
                    {/* ĐÃ SỬA: Hiển thị Biển số thay vì Sức chứa */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-green-700 shadow">
                      🛵 {motorbike.license_plate || 'Đang cập nhật'}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{motorbike.name}</h3>
                    {/* ĐÃ SỬA: Câu mô tả mẫu hợp lý hơn */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                      {motorbike.description || "Xe máy đời mới, chạy êm, tiết kiệm xăng. Thích hợp để dạo quanh FarmStay và các địa điểm lân cận."}
                    </p>
                    
                    <div className="flex justify-between items-end mb-6 border-t border-gray-100 pt-4">
                       <span className="text-sm font-medium text-gray-500">Giá thuê</span>
                       <span className="text-2xl font-bold text-red-600">
                          {Number(motorbike.base_price || 0).toLocaleString()} đ/ngày
                       </span>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                      <button 
                        onClick={() => handleViewDetail(motorbike.id)}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        🔍 Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================== */}
        {/* GIAO DIỆN NÚT PHÂN TRANG                   */}
        {/* ========================================== */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
            >
              Trước
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`w-10 h-10 rounded-lg font-bold transition ${currentPage === index + 1 ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50'}`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
            >
              Sau
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* THÔNG TIN LIÊN HỆ & HỖ TRỢ                 */}
        {/* ========================================== */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bạn cần hỗ trợ đặt xe?</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Đội ngũ của Hoàng Hân FarmStay luôn sẵn sàng tư vấn chi tiết và hỗ trợ bạn chọn được chiếc Xe máy ưng ý nhất cho chuyến đi sắp tới.
            </p>
            <div className="space-y-4">
              <p className="flex items-center text-gray-800 font-medium text-lg">
                <span className="w-10 text-2xl">📍</span> Thôn An Sơn, Xã Bà Nà, Huyện Hoà Vang Thành Phố Đà Nẵng, Việt Nam
              </p>
              <p className="flex items-center text-gray-800 font-medium text-lg">
                <span className="w-10 text-2xl">📞</span> Hotline/Zalo: 
                <a href="tel:0943052657" className="text-blue-600 ml-2 hover:underline">0943 052 657</a>
              </p>
              <p className="flex items-center text-gray-800 font-medium text-lg">
                <span className="w-10 text-2xl">✉️</span> Email: 
                <a href="mailto:booking@hoanghanfarmstay.com" className="text-blue-600 ml-2 hover:underline">booking@hoanghanfarmstay.com</a>
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex justify-center">
             <div className="bg-green-50 p-8 rounded-xl border border-green-200 text-center w-full max-w-sm shadow-inner">
                <h3 className="text-xl font-bold text-green-900 mb-2">Giờ làm việc</h3>
                <p className="text-green-700 text-lg">Thứ 2 - Chủ Nhật</p>
                <p className="text-green-800 font-bold text-2xl mb-6">07:00 - 22:00</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full w-full transition shadow-lg text-lg flex items-center justify-center gap-2">
                  <span className="text-2xl">💬</span> Chat qua Zalo
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}