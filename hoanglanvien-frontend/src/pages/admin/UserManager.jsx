import { useState, useEffect } from 'react';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else if (res.status === 401) {
        alert("Phiên đăng nhập Admin hết hạn. Vui lòng đăng nhập lại!");
      }
    } catch (err) {
      console.error("Lỗi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, action) => {
    let confirmMsg = action === 'unlock' ? "Bạn muốn mở khóa tài khoản này?" : "Bạn chắc chắn muốn khóa tài khoản này?";
    if (!window.confirm(confirmMsg)) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        alert("Cập nhật trạng thái thành công!");
        fetchUsers(); // Tải lại danh sách sau khi cập nhật
      } else {
        alert("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  if (loading) return <div className="p-10 text-center font-semibold text-gray-600">Đang tải danh sách người dùng...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản Khách hàng</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700 text-sm border-b">
              <th className="px-6 py-4 font-bold">Khách hàng</th>
              <th className="px-6 py-4 font-bold">Liên hệ</th>
              <th className="px-6 py-4 font-bold">Ngày đăng ký</th>
              <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
              <th className="px-6 py-4 font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500 italic">Chưa có người dùng nào đăng ký.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">ID: #{user.id}</p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">📧 {user.email}</p>
                    <p className="text-sm text-gray-600 mt-1">📞 {user.phone}</p>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.date_joined}
                  </td>

                  <td className="px-6 py-4 text-center align-middle">
                    {user.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Hoạt động</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Bị khóa</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center align-middle space-y-2 flex flex-col items-center">
                    {user.is_active ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'suspend')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1.5 px-3 rounded shadow w-28"
                        >
                          Khóa tạm thời
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'ban')}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow w-28"
                        >
                          Khóa vĩnh viễn
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(user.id, 'unlock')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded shadow w-28"
                      >
                        Mở khóa tài khoản
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}