
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function ClientLayout() {
    const navigate = useNavigate();
    const isUserLoggedIn = localStorage.getItem('userToken');
    const storedUser = localStorage.getItem('userData');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const userName = currentUser ? (currentUser.name || currentUser.first_name || 'Hồ sơ của tôi') : 'Hồ sơ của tôi';
    const handleLogout = () => {
       localStorage.removeItem('userToken');
       localStorage.removeItem('refreshToken');
       localStorage.removeItem('userData');
       window.location.href = '/';
    };

    // Quản lý trạng thái đang ở tiếng Anh hay tiếng Việt
    const [isEnglish, setIsEnglish] = useState(false);

    // Hàm "đánh lừa" Google Translate khi bấm nút
    const toggleGoogleTranslate = () => {
        // Tìm thẻ select ẩn của Google
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            // Đổi giá trị sang ngôn ngữ tương ứng
            select.value = isEnglish ? 'vi' : 'en';
            // Kích hoạt sự kiện thay đổi để Google bắt đầu dịch
            select.dispatchEvent(new Event('change'));
            // Cập nhật lại giao diện nút bấm
            setIsEnglish(!isEnglish);
        } else {
            alert("Hệ thống dịch đang tải, vui lòng thử lại sau 1 giây.");
        }
    };
    return (
        <div>
            {/* NÚT BẤM CHUYỂN NGÔN NGỮ ĐÃ ĐƯỢC NỐI VỚI GOOGLE */}
            <div className="fixed top-5 right-1 z-[999]">
                <button
                    onClick={toggleGoogleTranslate}
                    className="px-2 py-2 bg-gray-800 text-white rounded-lg font-bold shadow-lg hover:bg-gray-700 transition notranslate"
                >
                    {isEnglish ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                </button>
            </div>
            <div className="flex flex-col min-h-screen font-sans text-gray-800">
                {/* Header / Navbar */}
                <header className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <Link to="/" className="text-2xl font-bold text-green-700 tracking-wider">
                                    Hoàng Hân <span className="text-yellow-500">FarmStay</span>
                                </Link>
                            </div>
                            {/* Menu Navigation */}
                            <nav className="hidden md:flex space-x-8">
                                <Link to="/" className="text-gray-600 hover:text-green-600 font-bold transition">Trang chủ</Link>
                                <Link to="/bungalows" className="text-gray-600 hover:text-green-600 font-bold transition">Bungalow</Link>
                                <Link to="/restaurant" className="text-gray-600 hover:text-green-600 font-bold transition">Nhà hàng</Link>
                                <Link to="/motorbikes" className="text-gray-700 hover:text-green-600 font-bold transition">Thuê xe máy</Link>
                                <Link to="/thuvien" className="text-gray-700 hover:text-green-600 font-bold transition">Hình ảnh & Video</Link>
                                <Link to="/contact" className="text-red-600 hover:text-green-600 font-bold transition">Liên hệ</Link>
                            </nav>
                            {/* KHU VỰC NÚT TÀI KHOẢN VÀ ĐẶT PHÒNG TẠI ĐÂY */}
                            <div className="hidden md:flex items-center space-x-4">

                                {isUserLoggedIn ? (

                                    // Nếu ĐÃ đăng nhập: Hiện nút Đăng xuất
                                    <>
                                        <Link to="/profile" className="font-bold text-green-700 hover:text-green-800 transition flex items-center gap-1">
                                    👤 {userName} </Link>
                                         <button onClick={handleLogout} className="font-medium text-gray-600 hover:text-red-600 transition ml-2">
                                          Đăng xuất
                                         </button>
                                    </>
                                ) : (
                                    // Nếu CHƯA đăng nhập: Hiện 2 nút Đăng nhập & Đăng ký
                                    <div className="flex space-x-3 border-r pr-4 border-gray-300">
                                        {/* Truyền state isLogin: true để báo cho trang UserAuth biết mở form Login */}
                                        <Link
                                            to="/auth"
                                            state={{ isLogin: true }}
                                            className="text-gray-600 hover:text-green-600 font-bold transition"
                                        >
                                            Đăng nhập
                                        </Link>
                                        <span className="text-gray-300">|</span>
                                        {/* Truyền state isLogin: false để báo mở form Register */}
                                        <Link
                                            to="/auth"
                                            state={{ isLogin: false }}
                                            className="text-gray-600 hover:text-green-600 font-bold transition"
                                        >
                                            Đăng ký
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow pt-20">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-300 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Cột 1: Giới thiệu */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-4">Hoàng Hân FarmStay</h3>
                            <p className="text-sm">Trải nghiệm không gian nghỉ dưỡng tuyệt vời hòa mình vào thiên nhiên, nơi mang lại sự bình yên và thư giãn cho gia đình bạn.</p>
                        </div>

                        {/* Cột 2: Liên hệ */}
                        <div>
                            <h4 className="text-lg font-bold text-white mb-4">Liên hệ</h4>
                            <p className="text-sm mt-2">📞 Hotline: 0943052657</p>
                            <p className="text-sm mt-2">✉️ Email: booking@hoanghanfarmstay.com</p>
                            <p className="text-sm mt-2">📍 Địa chỉ: Thôn An Sơn, Xã Bà Nà, Huyện Hoà Vang, Thành Phố Đà Nẵng, Việt Nam</p>
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

                        {/* Cột 4: Bản đồ Google Maps - ĐÃ DỌN DẸP SẠCH LỖI HTML */}
                        <div className="w-full h-48 md:h-full min-h-[200px] rounded-lg overflow-hidden shadow-lg border border-gray-700">
                            <iframe
                                title="Bản đồ Hoàng Hân FarmStay"
                                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d525.8813683907584!2d108.06974284296518!3d16.024760231015723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1785390887984!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-12 border-t border-gray-700 pt-6">
                        © 2026 Hoàng Hân FarmStay. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>


    );
}