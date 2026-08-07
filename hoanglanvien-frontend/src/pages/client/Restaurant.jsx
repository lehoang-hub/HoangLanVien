import { useState, useEffect } from 'react';
import SEO from '../../components/SEO';

export default function Restaurant() {
  // Thay thế dữ liệu cứng bằng State
  const [foodMenu, setFoodMenu] = useState([]);
  const [drinkMenu, setDrinkMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // States quản lý giỏ hàng
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bungalowNumber, setBungalowNumber] = useState('');
  const [note, setNote] = useState('');

  // Lấy dữ liệu từ Database khi Load trang
  useEffect(() => {
    fetch('http://localhost:8000/api/client/menu-items')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Lọc mảng chung thành 2 mảng riêng biệt
          setFoodMenu(data.filter(item => item.type === 'food'));
          setDrinkMenu(data.filter(item => item.type === 'drink'));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải thực đơn:", err);
        setLoading(false);
      });
  }, []);

  // Các hàm xử lý giỏ hàng (Giữ nguyên)
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, amount) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + amount;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Giỏ hàng của bạn đang trống!");
    if (!bungalowNumber.trim()) return alert("Vui lòng nhập số/tên Bungalow!");
    
    alert(`ĐẶT MÓN THÀNH CÔNG!\nNhân viên sẽ mang món đến ${bungalowNumber} trong thời gian sớm nhất.\nTổng thanh toán: ${getTotalPrice().toLocaleString()} đ`);
    
    setCart([]);
    setIsCartOpen(false);
    setBungalowNumber('');
    setNote('');
  };

  // Component hiển thị Item chung
  const MenuItem = ({ item }) => (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden border border-gray-100 flex flex-col">
      <div className="h-48 overflow-hidden relative bg-gray-200 flex items-center justify-center">
        {/* Kiểm tra nếu có link ảnh thì hiển thị ảnh, ngược lại hiển thị dòng chữ Không có ảnh */}
        {item.image ? (
          <img 
            src={`http://localhost:8000/${item.image}`} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          />
        ) : (
          <span className="text-gray-400 font-medium italic text-sm">Không có ảnh</span>
        )}
        
        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full font-bold text-red-600 shadow">
          {Number(item.price).toLocaleString()} đ
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
        {item.description && <p className="text-sm text-gray-600 mt-2 flex-1">{item.description}</p>}
        <button 
          onClick={() => addToCart(item)}
          className="mt-4 w-full bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 font-semibold py-2 rounded-lg transition"
        >
          + Thêm vào giỏ
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-32 text-xl font-bold text-orange-700">Đang tải thực đơn...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative">
        <SEO 
        title="Nhà hàng & Ẩm thực" 
        description="Thưởng thức đặc sản vùng cao, ẩm thực tươi sạch và đồ uống mát lạnh tại nhà hàng Hoàng Hân FarmStay."
        url="https://hoanghanfarmstay.com/restaurant"
      />
      {/* Banner */}
      <div className="bg-orange-800 text-white py-16 text-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img src="https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Restaurant bg" />
        <div className="relative z-20">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-md">Nhà hàng Hoàng Hân</h1>
          <p className="text-lg max-w-2xl mx-auto text-orange-50 px-4 drop-shadow">
            Thưởng thức đặc sản vùng cao và đồ uống tươi mát. Hỗ trợ phục vụ tận phòng Bungalow của bạn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* THỰC ĐƠN ĐỒ ĂN */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 border-l-4 border-orange-500 pl-4">Thực đơn Món ăn</h2>
          <p className="text-gray-500 mb-8 ml-5">Đậm đà hương vị truyền thống & nguyên liệu tươi sạch</p>
          {foodMenu.length === 0 ? (
            <p className="text-gray-500 italic ml-5">Hiện chưa có món ăn nào trong thực đơn.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {foodMenu.map(item => <MenuItem key={item.id} item={item} />)}
            </div>
          )}
        </section>

        {/* THỰC ĐƠN ĐỒ UỐNG */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 border-l-4 border-blue-500 pl-4">Menu Đồ uống</h2>
          <p className="text-gray-500 mb-8 ml-5">Giải khát cực đã, pha chế từ trái cây tươi Farmstay</p>
          {drinkMenu.length === 0 ? (
            <p className="text-gray-500 italic ml-5">Hiện chưa có thức uống nào trong thực đơn.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {drinkMenu.map(item => <MenuItem key={item.id} item={item} />)}
            </div>
          )}
        </section>
      </div>

      {/* GIỎ HÀNG FLOATING BUTTON */}
      {cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:bg-orange-700 transition flex items-center gap-3 animate-bounce"
        >
          <span className="text-2xl">🛒</span>
          <div className="text-left hidden sm:block">
            <p className="text-xs text-orange-200">Giỏ hàng của bạn</p>
            <p className="font-bold">{cart.reduce((sum, i) => sum + i.quantity, 0)} Món • {getTotalPrice().toLocaleString()} đ</p>
          </div>
          <div className="sm:hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
             {cart.reduce((sum, i) => sum + i.quantity, 0)}
          </div>
        </button>
      )}

      {/* MODAL GIỎ HÀNG */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">🍽️ Chi tiết Đặt món</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-red-600 font-semibold">{Number(item.price).toLocaleString()} đ</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1 mx-4">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-600 hover:text-black font-bold px-2">-</button>
                    <span className="font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-600 hover:text-black font-bold px-2">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                </div>
              ))}

              <div className="mt-6 space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h4 className="font-bold text-orange-800 text-sm uppercase">Thông tin giao món</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số / Tên Bungalow của bạn <span className="text-red-500">*</span></label>
                  <input 
                    type="text" value={bungalowNumber} onChange={(e) => setBungalowNumber(e.target.value)}
                    placeholder="VD: Family 1, VIP 2..." 
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none bg-white" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Cho nhiều đá..." className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:outline-none bg-white h-20 resize-none"></textarea>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-600">Tổng thanh toán:</span>
                <span className="text-2xl font-bold text-red-600">{getTotalPrice().toLocaleString()} đ</span>
              </div>
              <button onClick={handlePlaceOrder} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg transition">
                Xác nhận Đặt món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}