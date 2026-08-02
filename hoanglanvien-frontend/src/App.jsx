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

// Client Components
import ClientLayout from './layouts/ClientLayout';
import Home from './pages/client/Home';
import BungalowsClient from './pages/client/Bungalows';
import RestaurantClient from './pages/client/Restaurant';
import Thuvien from './pages/client/Thuvien'; // Trang Thư viện khách xem[cite: 10]
import BungalowDetail from './pages/client/BungalowDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* ROUTES DÀNH CHO ADMIN DASHBOARD            */}
        {/* ========================================== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bungalows" element={<BungalowList />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="menu/food" element={<FoodList />} />
          <Route path="menu/drink" element={<DrinkList />} />
          
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