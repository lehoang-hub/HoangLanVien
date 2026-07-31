import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Home() {
  return (
    <div>
        <SEO 
        title="Trang chủ" 
        description="Hoàng Lan Viên FarmStay - Trốn khỏi ồn ào phố thị, tận hưởng không gian thiên nhiên trong lành và những căn bungalow ấm cúng."
        url="https://hoanglanvien.com"
      />
      {/* Hero Section */}
      
      <div className="relative h-[80vh] flex items-center justify-center bg-gray-200">
        {/* Placeholder cho ảnh nền, sau này bạn có thể thay bằng thẻ <img> hoặc background-image */}
        <div className="absolute inset-0 bg-green-900/40 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2070&auto=format&fit=crop" 
          alt="Farmstay Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Nơi Bình Yên Gọi Tên
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Trốn khỏi ồn ào phố thị, tận hưởng không gian thiên nhiên trong lành và những căn bungalow ấm cúng tại Hoàng Lan Viên.
          </p>
          <Link to="/bungalows" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-lg font-bold px-8 py-3 rounded-full transition shadow-xl">
            Khám phá phòng nghỉ
          </Link>
        </div>
      </div>

      {/* Search Bar / Quick Booking (Giả lập) */}
      <div className="max-w-4xl mx-auto -mt-10 relative z-30 bg-white rounded-xl shadow-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày nhận phòng</label>
          <input type="date" className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày trả phòng</label>
          <input type="date" className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số khách</label>
          <select className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-green-500 bg-white">
            <option>2 người lớn</option>
            <option>4 người lớn</option>
            <option>Gia đình</option>
          </select>
        </div>
        <button className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 rounded-lg transition mt-4 md:mt-0">
          Kiểm tra phòng
        </button>
      </div>
      
      <div className="h-40"></div> {/* Khoảng trống tạm thời */}
    </div>
  );
}