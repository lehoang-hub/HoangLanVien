export default function BookingList() {
  return (
    <div>
      {/* Tiêu đề và Thanh tìm kiếm */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt phòng</h1>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Tìm mã đơn, tên khách..." 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
            Tìm kiếm
          </button>
        </div>
      </div>
      
      {/* Bảng danh sách Booking */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="px-6 py-4 border-b font-semibold">Mã Booking</th>
              <th className="px-6 py-4 border-b font-semibold">Khách hàng</th>
              <th className="px-6 py-4 border-b font-semibold">Ngày Check-in/out</th>
              <th className="px-6 py-4 border-b font-semibold">Tổng tiền</th>
              <th className="px-6 py-4 border-b font-semibold">Trạng thái</th>
              <th className="px-6 py-4 border-b font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {/* Dòng dữ liệu mẫu 1 (Sau này sẽ map() từ API trả về) */}
            <tr className="hover:bg-gray-50 border-b transition">
              <td className="px-6 py-4 font-medium text-gray-900">HLV-20260730-A1B2</td>
              <td className="px-6 py-4">
                Nguyễn Văn A <br/>
                <span className="text-sm text-gray-500">0909 123 456</span>
              </td>
              <td className="px-6 py-4">
                30/07/2026 <br/>
                <span className="text-sm text-gray-500">đến 01/08/2026 (2 đêm)</span>
              </td>
              <td className="px-6 py-4 text-red-600 font-bold">1,500,000 đ</td>
              <td className="px-6 py-4">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">
                  Chờ xác nhận
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                  Chi tiết / Sửa
                </button>
              </td>
            </tr>
            
             {/* Dòng dữ liệu mẫu 2 */}
             <tr className="hover:bg-gray-50 border-b transition">
              <td className="px-6 py-4 font-medium text-gray-900">HLV-20260728-XYZ9</td>
              <td className="px-6 py-4">
                Trần Thị B <br/>
                <span className="text-sm text-gray-500">0988 777 666</span>
              </td>
              <td className="px-6 py-4">
                15/08/2026 <br/>
                <span className="text-sm text-gray-500">đến 16/08/2026 (1 đêm)</span>
              </td>
              <td className="px-6 py-4 text-red-600 font-bold">850,000 đ</td>
              <td className="px-6 py-4">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">
                  Đã thanh toán
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                  Chi tiết / Sửa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}