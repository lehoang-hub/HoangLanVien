import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'bookings', 'security'
  const [loading, setLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [myReviews, setMyReviews] = useState([]); // 🟢 Thêm state này
  const [remainingReviews, setRemainingReviews] = useState(0); // 🟢 Thêm state này
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  // 1. STATE THÔNG TIN CÁ NHÂN
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null,
    avatarPreview: null
  });

  // 2. STATE ĐỔI MẬT KHẨU
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 3. STATE LỊCH SỬ ĐẶT PHÒNG
  const [myBookings, setMyBookings] = useState([]);

  // KIỂM TRA ĐĂNG NHẬP VÀ TẢI DỮ LIỆU
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert("Vui lòng đăng nhập để xem thông tin tài khoản!");
      navigate('/auth');
      return;
    }

    // Lấy thông tin user từ LocalStorage (hoặc gọi API GET /api/user/profile/)
    const storedUser = JSON.parse(localStorage.getItem('userData')) || {};
    setProfile({
      name: storedUser.name || storedUser.first_name || '',
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      avatar: null,
      avatarPreview: storedUser.avatar || 'https://ui-avatars.com/api/?name=' + (storedUser.name || 'User') + '&background=0D8ABC&color=fff'
    });

    // Giả lập gọi API lấy lịch sử đặt phòng của user này
    fetchMyBookings(token);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/check-eligibility/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setCanReview(data.eligible);
      setRemainingReviews(data.remaining_reviews || 0); // 🟢 Lưu số lượt
      setMyReviews(data.my_reviews || []); // 🟢 Lưu bài đã viết
    })
    .catch(err => console.error("Lỗi kiểm tra quyền đánh giá:", err));
  }, [navigate]);

  const fetchMyBookings = async (token) => {
    try {
      // Lưu ý: Cần có API /bookings/my-bookings/ ở Backend Django
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/my-bookings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử đặt phòng:", err);
    }
  };

  // XỬ LÝ CHỌN AVATAR MỚI
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({
        ...profile,
        avatar: file,
        avatarPreview: URL.createObjectURL(file) // Tạo link preview ảnh cục bộ
      });
    }
  };

  // CẬP NHẬT THÔNG TIN CÁ NHÂN
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('phone', profile.phone);
    if (profile.avatar) {
      formData.append('avatar', profile.avatar);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/profile/update/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData // Gửi dạng FormData để hỗ trợ file ảnh
      });

      if (res.ok) {
        alert("Cập nhật thông tin thành công!");
        // Cập nhật lại LocalStorage
        const updatedData = await res.json();
        localStorage.setItem('userData', JSON.stringify(updatedData));
      } else {
        alert("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
    setLoading(false);
  };

  // XỬ LÝ ĐỔI MẬT KHẨU
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    if (passwords.newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('userToken');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwords.oldPassword,
          new_password: passwords.newPassword
        })
      });

      if (res.ok) {
        alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        localStorage.clear();
        navigate('/auth');
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Mật khẩu cũ không chính xác!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
    setLoading(false);
  };
const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    setIsSubmittingReview(true);
    const token = localStorage.getItem('userToken');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });

      if (response.ok) {
        alert("Cảm ơn bạn đã gửi đánh giá! Nhận xét của bạn sẽ xuất hiện ngoài trang chủ.");
        setReviewForm({ rating: 5, comment: '' });
        const eligRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/check-eligibility/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const eligData = await eligRes.json();
        setCanReview(eligData.eligible);
        setRemainingReviews(eligData.remaining_reviews || 0);
        setMyReviews(eligData.my_reviews || []);
        setActiveTab('profile'); // Chuyển về tab profile sau khi xong
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Có lỗi xảy ra, không thể gửi đánh giá!");
      }
    } catch (err) {
      alert("Lỗi kết nối đến máy chủ!");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Hàm vẽ sao
  const renderStars = (activeCount, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            onClick={() => interactive && setReviewForm({...reviewForm, rating: star})}
            className={`w-8 h-8 ${interactive ? 'cursor-pointer transition hover:scale-110' : ''} ${star <= activeCount ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  // Đăng xuất
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      navigate('/');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-8">

        {/* SIDEBAR */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group">
              <img
                src={profile.avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-50 shadow-md"
              />
            </div>
            <h3 className="font-bold text-lg text-gray-800">{profile.name}</h3>
            <p className="text-sm text-gray-500 mb-6">{profile.email}</p>

            <nav className="w-full space-y-2">
              <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === 'profile' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>👤 Thông tin cá nhân</button>
              <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === 'bookings' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>📅 Lịch sử đặt phòng</button>
              <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === 'security' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>🔒 Đổi mật khẩu</button>
              <button onClick={() => setActiveTab('review')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === 'review' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>⭐ Đánh giá FarmStay</button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition">🚪 Đăng xuất</button>
            </nav>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH (MAIN CONTENT) */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">

                  {/* Upload Avatar */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện (Avatar)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                    />
                  </div>

                  {/* Tên & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
                      <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                      <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                    </div>
                  </div>

                  {/* Email (Bị khóa) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ Email <span className="text-red-500 font-normal text-xs">(Không thể thay đổi)</span></label>
                    <input type="email" value={profile.email} disabled className="w-full border px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>

                  <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md">
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: LỊCH SỬ ĐẶT PHÒNG */}
            {activeTab === 'bookings' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử đặt phòng của bạn</h2>
                {myBookings.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
                    <p className="text-gray-500">Bạn chưa có đơn đặt phòng nào.</p>
                    <button onClick={() => navigate('/bungalows')} className="mt-3 text-green-600 font-bold hover:underline">Khám phá phòng ngay</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBookings.map((booking, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                        <div>
                          <p className="font-bold text-lg text-green-800">{booking.booking_code || `Đơn hàng #${booking.id}`}</p>
                          <p className="text-sm text-gray-600 font-medium">Bungalow ID: {booking.bungalow}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Từ <span className="font-bold">{booking.check_in_date}</span> đến <span className="font-bold">{booking.check_out_date}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{Number(booking.total_amount).toLocaleString()} đ</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'checked_in' || booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status === 'pending' ? 'Chờ thanh toán' : booking.status === 'checked_in' ? 'Đã Check-in' : booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ĐỔI MẬT KHẨU */}
            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Bảo mật tài khoản</h2>
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-sm">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input type="password" value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                  </div>
                  <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md w-full">
                    {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </div>
            )}
            {/* TAB 4: ĐÁNH GIÁ (REVIEWS) */}
            {activeTab === 'review' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá trải nghiệm của bạn</h2>

                {!canReview ? (
                  <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl border border-yellow-200 text-center">
                    <p className="font-medium text-lg mb-2">Chưa đủ điều kiện đánh giá</p>
                    <p className="text-sm">Tính năng đánh giá sẽ được mở sau khi bạn hoàn tất kỳ nghỉ và được FarmStay xác nhận check-out.</p>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="space-y-6 max-w-2xl bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Chất lượng dịch vụ bạn cảm nhận thế nào?</label>
                      {renderStars(reviewForm.rating, true)}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Chia sẻ chi tiết trải nghiệm</label>
                      <textarea
                        rows="5"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về phòng ốc, không gian, thái độ phục vụ..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className={`font-bold py-3 px-8 rounded-lg transition ${isSubmittingReview ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                    >
                      {isSubmittingReview ? 'Đang gửi đánh giá...' : 'Gửi đánh giá công khai'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}