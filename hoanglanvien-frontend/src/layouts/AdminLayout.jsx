import { useState } from 'react';
import { Link, Outlet, useNavigate,Navigate } from 'react-router-dom';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMediaMenuOpen, setIsMediaMenuOpen] = useState(false);
    const handleLogout = () => {
        navigate('/admin/login');
    };
    const isAuth = localStorage.getItem('isAdminLoggedIn');

    // Nếu chưa đăng nhập, tự động đá văng ra trang login
    if (!isAuth) {
        return <Navigate to="/admin/login" replace />;
    }
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 text-white flex flex-col">
                <div className="p-4 bg-slate-900 text-center font-bold text-xl tracking-wider">
                    Hoàng Hân <br /> FARMSTAY
                </div>
                <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                    <Link to="/admin" className="block px-4 py-2 rounded hover:bg-slate-700 transition">
                        📊 Tổng quan (Dashboard)
                    </Link>
                    <Link to="/admin/bungalows" className="block px-4 py-2 rounded hover:bg-slate-700 transition">
                        🏡 Quản lý Phòng
                    </Link>
                    <Link to="/admin/bookings" className="block px-4 py-2 rounded hover:bg-slate-700 transition">
                        📅 Quản lý Đặt phòng
                    </Link>
                    {/* MENU XE MÁY MỚI */}
                    <Link to="/admin/motorbikes" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded mt-2 border-t border-gray-700 pt-2">
                        🏍️ Quản lý Xe máy
                    </Link>
                    <Link to="/admin/motorbike-bookings" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded">
                        🛵 Quản lý Đặt xe
                    </Link>

                    {/* Thực đơn */}
                    <div>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-full text-left px-4 py-2 rounded hover:bg-slate-700 transition flex justify-between items-center"
                        >
                            <span>🍽️ Thực đơn (Menu)</span>
                            <span className="text-xs">{isMenuOpen ? '▲' : '▼'}</span>
                        </button>
                        {isMenuOpen && (
                            <div className="mt-1 bg-slate-900 rounded py-2 space-y-1">
                                <Link to="/admin/menu/food" className="block px-10 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition">
                                    🍔 Quản lý Đồ ăn
                                </Link>
                                <Link to="/admin/menu/drink" className="block px-10 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition">
                                    🍹 Quản lý Đồ uống
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Thư viện (Media) */}
                    <div>
                        <button onClick={() => setIsMediaMenuOpen(!isMediaMenuOpen)} className="w-full text-left px-4 py-2 rounded hover:bg-slate-700 transition flex justify-between items-center">
                            <span>📸 Thư viện (Media)</span>
                            <span className="text-xs">{isMediaMenuOpen ? '▲' : '▼'}</span>
                        </button>
                        {isMediaMenuOpen && (
                            <div className="mt-1 bg-slate-900 rounded py-2 space-y-1">
                                {/* ĐÃ SỬA LẠI ĐƯỜNG DẪN ĐÚNG CHUẨN */}
                                <Link to="/admin/images" className="block px-10 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition">🖼️ Quản lý Hình ảnh</Link>
                                <Link to="/admin/videos" className="block px-10 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition">🎥 Quản lý Video</Link>
                            </div>
                        )}
                    </div>

                    <Link to="/admin/settings" className="block px-4 py-2 rounded hover:bg-slate-700 transition">
                        ⚙️ Cài đặt chung
                    </Link>
                </nav>
                <div className="p-4 bg-slate-900">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition"
                    >
                        🚪 Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow flex items-center justify-between px-6 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Trang Quản Trị</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-medium">Chào, Admin</span>
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}