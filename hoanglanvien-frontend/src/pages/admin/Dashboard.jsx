import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50">
          Tải báo cáo 📥
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. KHỐI THỐNG KÊ NHANH (TẤT CẢ CÁC MỤC)    */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Doanh thu tháng này</p>
          <p className="text-3xl font-bold text-gray-800">45.5tr ₫</p>
          <p className="text-xs text-green-600 mt-2">↑ Tăng 12% so với tháng trước</p>
        </div>
        
        {/* Đặt phòng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Booking chờ xử lý</p>
          <p className="text-3xl font-bold text-gray-800">5</p>
          <Link to="/admin/bookings" className="text-xs text-blue-600 mt-2 hover:underline block">Xem chi tiết →</Link>
        </div>

        {/* Thực đơn */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Món ăn & Đồ uống</p>
          <p className="text-3xl font-bold text-gray-800">42</p>
          <div className="text-xs text-yellow-600 mt-2 flex gap-3">
            <Link to="/admin/menu/food" className="hover:underline">🍔 25 Món</Link>
            <Link to="/admin/menu/drink" className="hover:underline">🍹 17 Món</Link>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Thư viện Media</p>
          <p className="text-3xl font-bold text-gray-800">128</p>
          <div className="text-xs text-purple-600 mt-2 flex gap-3">
            <Link to="/admin/media/images" className="hover:underline">🖼️ 110 Ảnh</Link>
            <Link to="/admin/media/videos" className="hover:underline">🎥 18 Video</Link>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. BẢNG HOẠT ĐỘNG MỚI NHẤT                 */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Đơn đặt phòng mới */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Đơn đặt phòng mới nhất</h2>
            <Link to="/admin/bookings" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <div>
                <p className="font-semibold text-gray-800">Nguyễn Văn A</p>
                <p className="text-sm text-gray-500">Bungalow VIP Sân Vườn (2 đêm)</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Chờ duyệt</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-semibold text-gray-800">Trần Thị B</p>
                <p className="text-sm text-gray-500">Bungalow Couple (1 đêm)</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Đã thanh toán</span>
            </div>
          </div>
        </div>

        {/* Trạng thái Bungalow */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Trạng thái phòng hôm nay</h2>
            <Link to="/admin/bungalows" className="text-sm text-blue-600 hover:underline">Quản lý phòng</Link>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-700">7</p>
              <p className="text-sm text-green-600">Phòng trống</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-2xl font-bold text-red-700">5</p>
              <p className="text-sm text-red-600">Đang sử dụng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}