import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const token = localStorage.getItem('adminToken');

  // 1. STATE THỐNG KÊ
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [reviewsList, setReviewsList] = useState([]);

  // 2. STATE BỘ LỌC
  const [filterType, setFilterType] = useState('date');
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromMonth, setFromMonth] = useState(new Date().toISOString().slice(0, 7));
  const [toMonth, setToMonth] = useState(new Date().toISOString().slice(0, 7));

  // 3. STATE CHỨA DATA TỪ API
  const [bungalows, setBungalows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // 4. STATE KẾT QUẢ TÍNH TOÁN
  const [revenueData, setRevenueData] = useState([]);
  const [otherRevenue, setOtherRevenue] = useState({ food: 0, motor: 0, total: 0 });
  const [totals, setTotals] = useState({ room: 0, food: 0, motor: 0, sum: 0 });
  const [pendingBookingsList, setPendingBookingsList] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  // 🟢 FETCH TOÀN BỘ DỮ LIỆU (SỬ DỤNG CƠ CHẾ AN TOÀN)
  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      // Các API Public không truyền Token để tránh lỗi 401 chặn dữ liệu phòng
      fetch(`${import.meta.env.VITE_API_BASE_URL}/bungalows/`).then(res => res.ok ? res.json() : []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/`).then(res => res.ok ? res.json() : []),

      // Các API Private bắt buộc truyền Token
      fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/`, { headers }).then(res => res.ok ? res.json() : []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/food-orders/`, { headers }).then(res => res.ok ? res.json() : []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/motorbike-bookings/`, { headers }).then(res => res.ok ? res.json() : []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/customers/`, { headers }).then(res => res.ok ? res.json() : []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/`, { headers }).then(res => res.ok ? res.json() : [])
    ]).then(([bungalowsData, reviewsData, bookingsData, foodData, motorData, custData, usrData]) => {

      setBungalows(Array.isArray(bungalowsData) ? bungalowsData : (bungalowsData.results || []));
      setBookings(Array.isArray(bookingsData) ? bookingsData : (bookingsData.results || []));
      setFoodOrders(Array.isArray(foodData) ? foodData : (foodData.results || []));
      setMotorbikes(Array.isArray(motorData) ? motorData : (motorData.results || []));
      setCustomersList(Array.isArray(custData) ? custData : (custData.results || []));
      setUsersList(Array.isArray(usrData) ? usrData : (usrData.results || []));

      // Lấy chỉ số đánh giá (nếu có)
      if (reviewsData && reviewsData.reviews) {
        setReviewStats({
          average: reviewsData.average_rating || 0,
          total: reviewsData.total_reviews || 0
        });
        setReviewsList(reviewsData.reviews);
      }
    }).catch(err => console.error("Lỗi tải dữ liệu Dashboard:", err));
  }, [token]);

  // LOGIC TÍNH TOÁN DOANH THU (Có tích hợp Cầu nối Email để map Thuê xe)
  useEffect(() => {
    if (bungalows.length === 0) return;

    let start, end;
    if (filterType === 'date') {
      start = new Date(fromDate); start.setHours(0, 0, 0, 0);
      end = new Date(toDate); end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(fromMonth + '-01'); start.setHours(0, 0, 0, 0);
      end = new Date(toMonth + '-01');
      end.setMonth(end.getMonth() + 1); end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Lọc đơn hàng hợp lệ
    const validBookings = bookings.filter(b => inRange(b.created_at || b.check_in_date) && b.status !== 'cancelled');
    const validFoods = foodOrders.filter(f => inRange(f.created_at));
    const validMotors = motorbikes.filter(m => inRange(m.created_at || m.check_in_date) && m.status !== 'cancelled');

    setPendingBookingsList(validBookings.filter(b => b.status === 'pending'));

    // TẠO CẦU NỐI EMAIL ĐỂ MAP DỮ LIỆU
    const userEmailMap = {};
    usersList.forEach(u => { if (u.email) userEmailMap[String(u.id)] = u.email; });

    const customerEmailMap = {};
    customersList.forEach(c => { if (c.email) customerEmailMap[String(c.id)] = c.email; });

    let totalRoomAll = 0, totalFoodAll = 0, totalMotorAll = 0;
    const mappedFoodIds = new Set();
    const mappedMotorIds = new Set();

    const mappedRooms = bungalows.map(room => {
      // 1. Tiền Phòng
      const roomBks = validBookings.filter(b => String(b.bungalow) === String(room.id) || String(b.bungalow_id) === String(room.id));
      const roomRev = roomBks.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      const roomCustomerIds = roomBks.map(b => String(b.customer || b.customer_id));
      const roomCustomerEmails = roomCustomerIds.map(id => customerEmailMap[id]).filter(Boolean);

      // 2. Tiền Ăn Uống
      const roomFoods = validFoods.filter(f => {
        if (mappedFoodIds.has(f.id)) return false;
        const rn = String(f.room_number).toLowerCase();
        return rn === String(room.id) || rn.includes(room.name.toLowerCase());
      });
      roomFoods.forEach(f => mappedFoodIds.add(f.id));
      const foodRev = roomFoods.reduce((sum, f) => sum + Number(f.total_price || 0), 0);

      // 3. Tiền Thuê Xe Máy (Tự động map qua ID hoặc Email)
      const roomMotors = validMotors.filter(m => {
        if (mappedMotorIds.has(m.id)) return false;

        const motorIdStr = String(m.customer_id || m.customer);
        if (roomCustomerIds.includes(motorIdStr)) return true;

        const motorUserEmail = userEmailMap[motorIdStr];
        if (motorUserEmail && roomCustomerEmails.includes(motorUserEmail)) return true;

        return false;
      });
      roomMotors.forEach(m => mappedMotorIds.add(m.id));
      const motorRev = roomMotors.reduce((sum, m) => sum + Number(m.total_amount || 0), 0);

      totalRoomAll += roomRev; totalFoodAll += foodRev; totalMotorAll += motorRev;

      return { id: room.id, roomName: room.name, roomRev, foodRev, motorRev, total: roomRev + foodRev + motorRev };
    });

    const unmappedFoodRev = validFoods.filter(f => !mappedFoodIds.has(f.id)).reduce((sum, f) => sum + Number(f.total_price || 0), 0);
    const unmappedMotorRev = validMotors.filter(m => !mappedMotorIds.has(m.id)).reduce((sum, m) => sum + Number(m.total_amount || 0), 0);

    totalFoodAll += unmappedFoodRev;
    totalMotorAll += unmappedMotorRev;

    setRevenueData(mappedRooms);
    setOtherRevenue({ food: unmappedFoodRev, motor: unmappedMotorRev, total: unmappedFoodRev + unmappedMotorRev });
    setTotals({ room: totalRoomAll, food: totalFoodAll, motor: totalMotorAll, sum: totalRoomAll + totalFoodAll + totalMotorAll });

  }, [filterType, fromDate, toDate, fromMonth, toMonth, bungalows, bookings, foodOrders, motorbikes, customersList, usersList]);

  // XUẤT FILE EXCEL
  const handleExportExcel = () => {
    if (revenueData.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    let fileName = 'BaoCao_DoanhThu.xlsx';
    if (filterType === 'date') {
      fileName = fromDate === toDate ? `DoanhThu_Ngay_${fromDate}.xlsx` : `DoanhThu_${fromDate}_Den_${toDate}.xlsx`;
    } else {
      fileName = fromMonth === toMonth ? `DoanhThu_Thang_${fromMonth}.xlsx` : `DoanhThu_TuThang_${fromMonth}_DenThang_${toMonth}.xlsx`;
    }

    const excelData = revenueData.map((item, index) => ({
      "STT": index + 1,
      "Tên Phòng": item.roomName,
      "Doanh thu Phòng (VNĐ)": item.roomRev,
      "Doanh thu Ăn Uống (VNĐ)": item.foodRev,
      "Doanh thu Đặt Xe (VNĐ)": item.motorRev,
      "Tổng Doanh thu (VNĐ)": item.total
    }));

    if (otherRevenue.total > 0) {
      excelData.push({
        "STT": "*", "Tên Phòng": "Khách lẻ / Dịch vụ ngoài",
        "Doanh thu Phòng (VNĐ)": 0, "Doanh thu Ăn Uống (VNĐ)": otherRevenue.food,
        "Doanh thu Đặt Xe (VNĐ)": otherRevenue.motor, "Tổng Doanh thu (VNĐ)": otherRevenue.total
      });
    }

    excelData.push({
      "STT": "", "Tên Phòng": "TỔNG CỘNG HỆ THỐNG",
      "Doanh thu Phòng (VNĐ)": totals.room, "Doanh thu Ăn Uống (VNĐ)": totals.food,
      "Doanh thu Đặt Xe (VNĐ)": totals.motor, "Tổng Doanh thu (VNĐ)": totals.sum
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo Doanh Thu");
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 relative">
      <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống (Real-time)</h1>

      {/* 1. KHỐI THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Tổng Doanh Thu</p>
          <p className="text-3xl font-bold text-gray-800">{(totals.sum / 1000000).toFixed(1)}tr ₫</p>
          <p className="text-xs text-green-600 mt-2">Dựa trên khoảng thời gian đang lọc</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Booking chờ duyệt</p>
          <p className="text-3xl font-bold text-gray-800">{pendingBookingsList.length}</p>
          <button onClick={() => setActiveModal('pending')} className="text-xs text-blue-600 mt-2 hover:underline block cursor-pointer">
            Xem chi tiết đơn chờ →
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400">
          <p className="text-gray-500 text-sm font-medium mb-1">Đánh giá khách hàng</p>
          <p className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            {reviewStats.average} <span className="text-yellow-400 text-2xl">★</span>
          </p>
          <button onClick={() => setActiveModal('reviews')} className="text-xs text-yellow-600 mt-2 hover:underline block cursor-pointer">
            Xem chi tiết {reviewStats.total} đánh giá →
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
          <p className="text-gray-500 text-sm font-medium mb-1">Tổng số Phòng (Bungalows)</p>
          <p className="text-3xl font-bold text-gray-800">{bungalows.length}</p>
          <button onClick={() => setActiveModal('bungalows')} className="text-xs text-indigo-600 mt-2 hover:underline block cursor-pointer">
            Xem danh sách phòng →
          </button>
        </div>
      </div>

      {/* 2. BẢNG THỐNG KÊ DOANH THU */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-8">
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-gray-800 text-lg w-full xl:w-auto">Phân tích Doanh thu từng phòng</h2>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 font-semibold bg-white">
              <option value="date">Lọc theo Ngày</option>
              <option value="month">Lọc theo Tháng</option>
            </select>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-500 font-medium pl-1">Từ:</span>
              <input type={filterType === 'date' ? 'date' : 'month'} value={filterType === 'date' ? fromDate : fromMonth} onChange={(e) => filterType === 'date' ? setFromDate(e.target.value) : setFromMonth(e.target.value)} className="text-sm outline-none bg-transparent border-none focus:ring-0 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-500 font-medium pl-1">Đến:</span>
              <input type={filterType === 'date' ? 'date' : 'month'} value={filterType === 'date' ? toDate : toMonth} onChange={(e) => filterType === 'date' ? setToDate(e.target.value) : setToMonth(e.target.value)} className="text-sm outline-none bg-transparent border-none focus:ring-0 cursor-pointer" />
            </div>
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow-md text-sm font-bold transition flex items-center gap-2">
              📥 Tải Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Tên Phòng</th>
                <th className="px-6 py-4 text-right">Doanh thu Phòng</th>
                <th className="px-6 py-4 text-right">F&B (Ăn uống)</th>
                <th className="px-6 py-4 text-right">Thuê Xe Máy</th>
                <th className="px-6 py-4 text-right font-bold text-green-700">Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-gray-800">
                  <td className="px-6 py-4 font-medium">{item.roomName}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{item.roomRev.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-6 py-4 text-right text-gray-500">{item.foodRev.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-6 py-4 text-right text-gray-500">{item.motorRev.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-6 py-4 text-right font-bold text-green-700 bg-green-50/30">{item.total.toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
              {otherRevenue.total > 0 && (
                 <tr className="border-b border-gray-200 bg-yellow-50/30 text-gray-800 italic">
                  <td className="px-6 py-4 font-medium text-yellow-800">Dịch vụ ngoài (Khách vãng lai)</td>
                  <td className="px-6 py-4 text-right text-gray-500">0 ₫</td>
                  <td className="px-6 py-4 text-right text-gray-500">{otherRevenue.food.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-6 py-4 text-right text-gray-500">{otherRevenue.motor.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-6 py-4 text-right font-bold text-yellow-700">{otherRevenue.total.toLocaleString('vi-VN')} ₫</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-5 text-base uppercase">TỔNG CỘNG HỆ THỐNG</td>
                <td className="px-6 py-5 text-right">{totals.room.toLocaleString('vi-VN')} ₫</td>
                <td className="px-6 py-5 text-right">{totals.food.toLocaleString('vi-VN')} ₫</td>
                <td className="px-6 py-5 text-right">{totals.motor.toLocaleString('vi-VN')} ₫</td>
                <td className="px-6 py-5 text-right text-green-800 text-lg">{totals.sum.toLocaleString('vi-VN')} ₫</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. MODAL HIỂN THỊ CHI TIẾT OVERLAY */}
      {activeModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {activeModal === 'pending' ? 'Danh sách Booking đang chờ duyệt' :
                 activeModal === 'reviews' ? 'Chi tiết các Đánh giá Khách hàng' :
                 'Danh sách Bungalows Hệ thống'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {activeModal === 'pending' && (
                pendingBookingsList.length === 0 ? <p className="text-center text-gray-500">Không có đơn hàng nào chờ duyệt.</p> :
                <div className="space-y-4">
                  {pendingBookingsList.map(bk => (
                    <div key={bk.id} className="border p-4 rounded-lg flex justify-between items-center bg-blue-50/30">
                      <div>
                        <p className="font-bold text-gray-800">{bk.booking_code} <span className="font-normal text-gray-600">| ID Khách: {bk.customer}</span></p>
                        <p className="text-sm text-gray-600">In: {bk.check_in_date} - Out: {bk.check_out_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{Number(bk.total_amount).toLocaleString('vi-VN')} đ</p>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Chờ duyệt</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'reviews' && (
                reviewsList.length === 0 ? <p className="text-center text-gray-500">Chưa có bài đánh giá nào.</p> :
                <div className="space-y-4">
                  {reviewsList.map(rv => (
                    <div key={rv.id} className="border p-4 rounded-lg bg-yellow-50/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-800">{rv.user_name} <span className="text-yellow-500 ml-2">{"★".repeat(rv.rating)}</span></p>
                        <p className="text-xs text-gray-500">{new Date(rv.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <p className="text-gray-700 italic text-sm">"{rv.comment}"</p>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'bungalows' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bungalows.map(room => (
                    <div key={room.id} className="border p-4 rounded-lg bg-indigo-50/30 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{room.name}</p>
                        <p className="text-xs text-gray-600">Sức chứa: {room.capacity} - {room.max_capacity} người</p>
                      </div>
                      <p className="font-bold text-green-700">{Number(room.base_price).toLocaleString('vi-VN')} đ</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-right">
              <button onClick={() => setActiveModal(null)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}