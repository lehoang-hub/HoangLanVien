import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  // Đổi tên state username thành email cho chuẩn với Backend mới
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn form tự động reload lại trang[cite: 2]
    setError('');
    setIsLoading(true);

    try {
      // Gọi API Đăng nhập của Django ở cổng 8001
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/token/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: JSON.stringify({
    email: email,
    password: password
  })
});

      const data = await response.json();

      if (response.ok && data.access) {
        // CẬP NHẬT: Kiểm tra thêm is_superuser của Django (chuẩn bảo mật mới)
        // Kết hợp với role cũ để tương thích ngược nếu sau này bạn dùng lại bảng Laravel
        if (data.user?.is_superuser === true || data.user?.role === 'admin')  {

          localStorage.setItem('isAdminLoggedIn', 'true'); // Giữ lại cờ xác nhận cũ của bạn[cite: 2]
          localStorage.setItem('adminToken', data.access);
          localStorage.setItem('adminRefreshToken', data.refresh);
          localStorage.setItem('adminData', JSON.stringify(data.user));

          // Đăng nhập thành công -> Chuyển hướng thẳng vào trang Admin[cite: 2]
          navigate('/admin');
        } else {
          // Nếu là tài khoản khách hàng đi lạc vào trang Admin
          setError('Tài khoản của bạn không có quyền truy cập trang quản trị!');
        }
      } else {
        // Đăng nhập thất bại -> Hiển thị lỗi[cite: 2]
        setError(data.detail || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4">

        {/* Tiêu đề & Logo[cite: 2] */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-700 tracking-wider">
            Hoàng Hân <span className="text-yellow-500">FarmStay</span>
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Đăng nhập trang quản trị</p>
        </div>

        {/* Khung báo lỗi (chỉ hiện khi có lỗi) */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-200 animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        {/* Form nhập liệu[cite: 2] */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="Nhập email quản trị viên..."
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md mt-2 ${
              isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

      </div>
    </div>
  );
}