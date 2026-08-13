import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Components
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import BungalowList from './pages/admin/BungalowList';
import BookingList from './pages/admin/BookingList';
import FoodList from './pages/admin/FoodList';
import DrinkList from './pages/admin/DrinkList';
import ImageList from './pages/admin/ImageList';
import VideoList from './pages/admin/VideoList';
import Settings from './pages/admin/Settings';
import MotorbikeList from './pages/admin/MotorbikeList';
import MotorbikeBookingList from './pages/admin/MotorbikeBookingList';
import UserAuth from './pages/client/UserAuth';
import CreateBungalow from './pages/admin/CreateBungalow';
import MenuOrderList from './pages/admin/MenuOrderList';
import IntroductionManager from './pages/admin/IntroductionManager';

// Client Components
import ClientLayout from './layouts/ClientLayout';
import Home from './pages/client/Home';
import BungalowsClient from './pages/client/Bungalows';
import RestaurantClient from './pages/client/Restaurant';
import Thuvien from './pages/client/Thuvien';
import BungalowDetail from './pages/client/BungalowDetail';
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
          <Route path="menu/orders" element={<MenuOrderList />} />

          {/* 🟢 SỬA LỖI ĐƯỜNG DẪN: Xóa dấu gạch chéo đầu để biến thành Route tương đối */}
          <Route path="introductions" element={<IntroductionManager />} />

          <Route path="motorbikes" element={<MotorbikeList />} />
          <Route path="motorbike-bookings" element={<MotorbikeBookingList />} />
          <Route path="bungalows/create" element={<CreateBungalow />} />
          <Route path="bungalows/edit/:id" element={<CreateBungalow />} />
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
          <Route path="/bungalows/:id" element={<BungalowDetail />} />
          <Route path="/motorbikes" element={<Motorbikes />} />
          <Route path="/motorbikes/:id" element={<MotorbikeDetail />} />
          <Route path="/auth" element={<UserAuth />} />
          <Route path="thuvien" element={<Thuvien />} />
        </Route>

        {/* Xử lý lỗi 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;