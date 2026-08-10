import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Components
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import BungalowList from './pages/admin/BungalowList';
import BookingList from './pages/admin/BookingList';
import FoodList from './pages/admin/FoodList';
import DrinkList from './pages/admin/DrinkList';
import ImageList from './pages/admin/ImageList'; // Import quản lý ảnh Admin[cite: 7]
import VideoList from './pages/admin/VideoList'; // Import quản lý video Admin[cite: 8]
import Settings from './pages/admin/Settings';
import MotorbikeList from './pages/admin/MotorbikeList';
import MotorbikeBookingList from './pages/admin/MotorbikeBookingList';
import UserAuth from './pages/client/UserAuth';
import CreateBungalow from './pages/admin/CreateBungalow';


// Client Components
import ClientLayout from './layouts/ClientLayout';
import Home from './pages/client/Home';
import BungalowsClient from './pages/client/Bungalows';
import RestaurantClient from './pages/client/Restaurant';
import Thuvien from './pages/client/Thuvien'; // Trang Thư viện khách xem[cite: 10]
import BungalowDetail from './pages/client/BungalowDetail';
// Chú ý điều chỉnh đường dẫn './pages/...' cho khớp với cấu trúc thư mục thực tế của bạn
import Motorbikes from './pages/client/Motorbikes';
import MotorbikeDetail from './pages/client/MotorbikeDetail';
import AdminLogin from './pages/admin/AdminLogin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* ROUTES DÀNH CHO ADMIN DASHBOARD            */}
        {/* ========================================== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bungalows" element={<BungalowList />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="menu/food" element={<FoodList />} />
          <Route path="menu/drink" element={<DrinkList />} />
          {/* ĐÃ THÊM ROUTE CHO QUẢN LÝ XE MÁY */}
          <Route path="/admin/motorbikes" element={<MotorbikeList />} />
          <Route path="/admin/motorbike-bookings" element={<MotorbikeBookingList />} />
          {/* Đây là route mà nút "Thêm mới" sẽ dẫn đến */}
          <Route path="/admin/bungalows/create" element={<CreateBungalow />} />

          {/* ĐÃ THÊM ROUTE CHO CRUD ẢNH VÀ VIDEO */}
          <Route path="images" element={<ImageList />} />
          <Route path="videos" element={<VideoList />} />
        </Route>

        {/* ========================================== */}
        {/* ROUTES DÀNH CHO CLIENT WEBSITE             */}
        {/* ========================================== */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="bungalows" element={<BungalowsClient />} />
          <Route path="restaurant" element={<RestaurantClient />} />
          {/* Route trang chi tiết Bungalow */}
          <Route path="/bungalows/:id" element={<BungalowDetail />} />
          <Route path="/motorbikes" element={<Motorbikes />} />
          <Route path="/motorbikes/:id" element={<MotorbikeDetail />} />
          <Route path="/auth" element={<UserAuth />} />

          {/* ĐÃ ĐƯA ROUTE THƯ VIỆN VÀO ĐÚNG CẤU TRÚC CLIENT */}
          <Route path="thuvien" element={<Thuvien />} />
        </Route>

        {/* Xử lý lỗi 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;