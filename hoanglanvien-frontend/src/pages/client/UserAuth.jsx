import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // 🟢 STATE QUẢN LÝ MẮT HIỂN THỊ MẬT KHẨU
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // 🟢 HÀM VALIDATE DỮ LIỆU CHUẨN TRƯỚC KHI GỬI
  const validateForm = () => {
    if (!isLogin) {
      // 1. Validate Email bằng Regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Địa chỉ email không đúng định dạng!');
        return false;
      }

      // 2. Validate độ dài mật khẩu
      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự!');
        return false;
      }

      // 3. Validate khớp mật khẩu
      if (formData.password !== formData.password_confirmation) {
        setError('Mật khẩu nhập lại không khớp!');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Gọi hàm Validate trước khi kích hoạt loading
    if (!validateForm()) return;

    setIsLoading(true);

    if (isLogin) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/token/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (response.ok && data.access) {
          localStorage.setItem('userToken', data.access);
          localStorage.setItem('refreshToken', data.refresh);
          localStorage.setItem('userData', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          setError(data.detail || 'Tài khoản hoặc mật khẩu không chính xác!');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
      }

    } else {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          // 🟢 CẬP NHẬT THÔNG BÁO THÀNH CÔNG CÓ NHẮC TỚI EMAIL
          setSuccess(`Đăng ký thành công! Một email xác nhận đã được gửi đến ${formData.email}. Vui lòng đăng nhập.`);

          setIsLogin(true);
          setFormData({ ...formData, password: '', password_confirmation: '' });
          setShowPassword(false);
          setShowConfirmPassword(false);
        } else {
          setError(data.detail || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin!');
        }
      } catch (err) {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
      }
    }

    setIsLoading(false);
  };

  // Icon Mắt (Mở/Đóng) dạng SVG thu gọn
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

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

            {/* 🟢 KHU VỰC NHẬP MẬT KHẨU (CÓ MẮT HIỂN THỊ) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative mt-1">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600 focus:outline-none"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700">Nhập lại Mật khẩu</label>
                <div className="relative mt-1">
                  <input
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    required={!isLogin}
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
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