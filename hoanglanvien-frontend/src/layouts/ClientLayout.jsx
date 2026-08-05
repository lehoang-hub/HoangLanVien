import { Link, Outlet } from 'react-router-dom';

export default function ClientLayout() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      {/* Header / Navbar */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-green-700 tracking-wider">
                Hoàng Lan <span className="text-yellow-500">FarmStay</span>
              </Link>
            </div>
            
            {/* Menu Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-green-600 font-medium transition">Trang chủ</Link>
              <Link to="/bungalows" className="text-gray-600 hover:text-green-600 font-medium transition">Bungalow</Link>
              <Link to="/restaurant" className="text-gray-600 hover:text-green-600 font-medium transition">Nhà hàng</Link>
              <Link to="/thuvien" className="text-gray-700 hover:text-green-600 font-medium transition">
  Hình ảnh & Video
</Link>
              <Link to="/contact" className="text-gray-600 hover:text-green-600 font-medium transition">Liên hệ</Link>
            </nav>

            {/* Nút Book Now */}
            <div className="hidden md:flex">
              <Link to="/bungalows" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition shadow-lg">
                Đặt phòng ngay
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content (Có padding top để không bị header che mất) */}
      <main className="flex-grow pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Cột 1: Giới thiệu */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Hoàng Lan FarmStay</h3>
            <p className="text-sm">Trải nghiệm không gian nghỉ dưỡng tuyệt vời hòa mình vào thiên nhiên, nơi mang lại sự bình yên và thư giãn cho gia đình bạn.</p>
          </div>
          
          {/* Cột 2: Liên hệ */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Liên hệ</h4>
            <p className="text-sm mt-2">📞 Hotline: 0943052657</p>
            <p className="text-sm mt-2">✉️ Email: booking@hoanglanvien.com</p>
            <p className="text-sm mt-2">📍 Địa chỉ: Xã Bà Nà, Thành Phố Đà Nẵng, Việt Nam</p>
          </div>
          
          {/* Cột 3: Liên kết nhanh */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/bungalows" className="hover:text-green-400">Danh sách phòng</Link></li>
              <li><Link to="/policy" className="hover:text-green-400">Chính sách đặt phòng</Link></li>
              <li><Link to="/admin" className="hover:text-green-400">Đăng nhập Admin</Link></li>
            </ul>
          </div>

          {/* Cột 4: Bản đồ Google Maps (Mới) */}
          <div className="w-full h-48 md:h-full min-h-[200px] rounded-lg overflow-hidden shadow-lg border border-gray-700">
            <iframe 
              title="Bản đồ Hoàng Lan FarmStay"
              // LƯU Ý: Chút nữa bạn sẽ thay link nhúng của bạn vào thuộc tính src bên dưới
             src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d525.8813683907584!2d108.06974284296518!3d16.024760231015723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1785390887984!5m2!1svi!2s" width="600" height="450" style="border:0;" allowFullScreen="" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-12 border-t border-gray-700 pt-6">
          © 2026 Hoàng Lan FarmStay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}