export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt chung</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên Farmstay</label>
              <input type="text" defaultValue="Hoàng Lan Viên FarmStay" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotline</label>
              <input type="text" defaultValue="0909 123 456" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
            <input type="text" defaultValue="Vùng núi thanh bình, Việt Nam" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Google Maps</label>
            <input type="text" defaultValue="https://maps.app.goo.gl/SgNh4eBi4VkwtfAS8" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}