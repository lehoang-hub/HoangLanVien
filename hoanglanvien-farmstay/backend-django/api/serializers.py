from rest_framework import serializers
from .models import (
    Bookings,
    BookingDetails,
    Bungalows,
    BungalowImages,
    Customers,
    Motorbikes,
    MotorbikeBookings,
    MenuItems,
    Galleries,
    Users
)

# 1. Quản lý Đặt phòng
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookings
        fields = '__all__'

class BookingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingDetails
        fields = '__all__'

# 2. Quản lý Bungalow (Phòng)
class BungalowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bungalows
        fields = '__all__'

class BungalowImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BungalowImages
        fields = '__all__'

# 3. Quản lý Khách hàng
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customers
        fields = '__all__'

# 4. Quản lý Thuê Xe máy
class MotorbikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motorbikes
        fields = '__all__'

class MotorbikeBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotorbikeBookings
        fields = '__all__'

# 5. Quản lý Dịch vụ ăn uống & Hình ảnh
class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItems
        fields = '__all__'

class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Galleries
        fields = '__all__'

# 6. Quản lý Người dùng (Admin/Nhân viên)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        # ⚠️ Lưu ý Bảo mật: Riêng bảng Users, chúng ta không dùng '__all__'
        # để tránh việc vô tình trả về cột 'password' ra ngoài API cho Frontend.
        fields = ['id', 'name', 'email', 'role', 'created_at']
