import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Ngăn form tự động reload lại trang
    
    // Kiểm tra tài khoản và mật khẩu
    if (username === 'admin' && password === '8888') {
      // Lưu trạng thái đăng nhập vào bộ nhớ trình duyệt
      localStorage.setItem('isAdminLoggedIn', 'true');
      
      // Đăng nhập thành công -> Chuyển hướng thẳng vào trang Admin
      navigate('/admin');
    } else {
      // Đăng nhập thất bại -> Hiển thị lỗi
      setError('Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4">
        
        {/* Tiêu đề & Logo */}
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

        {/* Form nhập liệu */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="Nhập admin..."
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
              placeholder="Nhập 8888..."
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md mt-2"
          >
            Đăng nhập
          </button>
        </form>

      </div>
    </div>
  );
}