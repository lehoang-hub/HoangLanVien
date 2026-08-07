import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận diện xem khách muốn mở form Đăng nhập hay Đăng ký từ Header truyền sang
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cập nhật form tự động nếu khách bấm qua lại trên Menu Header
  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      setIsLogin(location.state.isLogin);
      setError('');
      setSuccess('');
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (isLogin) {
      // ==========================================
      // LOGIC 1: XỬ LÝ ĐĂNG NHẬP
      // ==========================================
      try {
        const response = await fetch('http://localhost:8000/api/client/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await response.json();

        if (response.ok && data.token) {
          // Lưu token vào trình duyệt
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          
          // Đăng nhập thành công -> Về trang chủ hoặc trang trước đó
          navigate('/');
        } else {
          setError(data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
      }

    } else {
      // ==========================================
      // LOGIC 2: XỬ LÝ ĐĂNG KÝ
      // ==========================================
      if (formData.password !== formData.password_confirmation) {
        setError('Mật khẩu nhập lại không khớp!');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/client/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            password_confirmation: formData.password_confirmation
          })
        });
        
        const data = await response.json();

        if (response.ok) {
          setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
          // Đăng ký xong tự động lật sang form Login và xóa mật khẩu cũ
          setIsLogin(true);
          setFormData({ ...formData, password: '', password_confirmation: '' });
        } else {
          // Xử lý hiển thị lỗi validate từ Laravel (nếu có)
          const errorMsg = data.errors ? Object.values(data.errors)[0][0] : data.message;
          setError(errorMsg || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin!');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="text-3xl font-bold text-green-700 tracking-wider inline-block mb-2">
          Hoàng Hân <span className="text-yellow-500">FarmStay</span>
        </Link>
        <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
          {isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Khu vực hiển thị thông báo Lỗi / Thành công */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200 animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center border border-green-200 animate-fade-in">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* CÁC TRƯỜNG CHỈ HIỆN KHI ĐĂNG KÝ */}
            {!isLogin && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input
                    name="phone"
                    type="tel"
                    required={!isLogin}
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>
            )}

            {/* EMAIL & PASSWORD (Dùng chung) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {/* XÁC NHẬN MẬT KHẨU (Chỉ hiện khi Đăng ký) */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700">Nhập lại Mật khẩu</label>
                <input
                  name="password_confirmation"
                  type="password"
                  required={!isLogin}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm font-medium text-green-600 hover:text-green-500">
                  Quên mật khẩu?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all ${
                isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none'
              }`}
            >
              {isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản')}
            </button>
          </form>

          {/* Dòng text điều hướng chuyển đổi form */}
          <div className="mt-8 text-center text-sm text-gray-600">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="font-bold text-green-600 hover:text-green-500 transition"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}