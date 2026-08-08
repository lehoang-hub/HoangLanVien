import { useState, useEffect } from 'react';

export default function BungalowList() {
  const [bungalows, setBungalows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Tự động gọi API khi trang vừa tải xong
  useEffect(() => {
    const fetchBungalows = async () => {
      try {
        // Trỏ thẳng vào cổng 8001 của Django. Không cần Header kẹp Token!
        const response = await fetch('http://127.0.0.1:8001/api/bungalows/');

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu từ máy chủ');
        }

        const data = await response.json();
        setBungalows(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBungalows();
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Đang tải danh sách phòng...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 font-medium">Lỗi: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Khám phá <span className="text-green-700">Bungalow</span> của chúng tôi
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Tận hưởng không gian hòa mình vào thiên nhiên tại Hoàng Hân FarmStay.
        </p>
      </div>

      {/* Dàn Grid hiển thị danh sách phòng */}
      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:gap-x-8">
        {bungalows.map((room) => (
          <div key={room.id} className="group relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

            {/* Khung ảnh (Bạn nhớ thay trường 'image' bằng tên cột ảnh thực tế trong DB) */}
            <div className="w-full h-56 bg-gray-200 aspect-w-1 aspect-h-1 rounded-t-2xl overflow-hidden group-hover:opacity-90 transition-opacity">
              <img
                src={room.image || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=800&auto=format&fit=crop"}
                alt={room.name}
                className="w-full h-full object-center object-cover"
              />
            </div>

            {/* Nội dung thông tin */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {room.name}
              </h3>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="mr-4 flex items-center">
                  👥 Tối đa: {room.capacity || 2} khách
                </span>
                <span className="flex items-center">
                  🛏️ {room.bed_type || '1 Giường đôi'}
                </span>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-6">
                {room.description || 'Không gian nghỉ dưỡng tuyệt vời với đầy đủ tiện nghi, mang lại trải nghiệm đáng nhớ cho bạn và người thân.'}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <p className="text-2xl font-extrabold text-green-700">
                  {/* Định dạng tiền tệ VND */}
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price || 500000)}
                </p>

                <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Đặt ngay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}