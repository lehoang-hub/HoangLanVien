import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CUSTOMER', 'Khách hàng'),
        ('ADMIN', 'Quản trị viên'),
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Số điện thoại")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER', verbose_name="Vai trò")

    def is_farmstay_admin(self):
        return self.role == 'ADMIN' or self.is_superuser

    class Meta:
        verbose_name = "Người dùng"
        verbose_name_plural = "Danh sách người dùng"


class Room(models.Model):
    ROOM_TYPE_CHOICES = (
        ('SINGLE', 'Phòng Đơn'),
        ('DOUBLE', 'Phòng Đôi'),
        ('FAMILY', 'Phòng Gia Đình'),
        ('BUNGALOW', 'Bungalow Gỗ'),
        ('VILLA', 'Villa Ven Hồ'),
    )
    STATUS_CHOICES = (
        ('AVAILABLE', 'Sẵn sàng'),
        ('MAINTENANCE', 'Bảo trì'),
    )
    name = models.CharField(max_length=100, verbose_name="Tên phòng")
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='DOUBLE', verbose_name="Loại phòng")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá phòng (VNĐ/đêm)")
    capacity = models.IntegerField(default=2, verbose_name="Sức chứa (người)")
    description = models.TextField(blank=True, verbose_name="Mô tả")
    image_url = models.CharField(max_length=500, blank=True, verbose_name="Link hình ảnh")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', verbose_name="Trạng thái")

    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"

    class Meta:
        verbose_name = "Phòng"
        verbose_name_plural = "Danh sách phòng"


class Service(models.Model):
    SERVICE_TYPE_CHOICES = (
        ('FOOD', 'Món ăn'),
        ('DRINK', 'Thức uống'),
        ('MOTORBIKE', 'Thuê xe máy'),
    )
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, verbose_name="Loại dịch vụ")
    name = models.CharField(max_length=100, verbose_name="Tên dịch vụ")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Đơn giá (VNĐ)")
    unit = models.CharField(max_length=50, default="phần", verbose_name="Đơn tính")
    is_available = models.BooleanField(default=True, verbose_name="Đang phục vụ")
    description = models.TextField(blank=True, verbose_name="Mô tả dịch vụ")
    image_url = models.CharField(max_length=500, blank=True, verbose_name="Link hình ảnh")

    def __str__(self):
        return f"[{self.get_service_type_display()}] {self.name} - {self.price:,.0f} VNĐ"

    class Meta:
        verbose_name = "Dịch vụ"
        verbose_name_plural = "Danh sách dịch vụ"


class Booking(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('PENDING_PAYMENT', 'Chờ thanh toán'),
        ('PAID', 'Đã thanh toán'),
        ('CANCELLED', 'Đã hủy'),
    )
    booking_code = models.CharField(max_length=32, unique=True, verbose_name="Mã đặt phòng")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', verbose_name="Khách hàng")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings', verbose_name="Phòng đặt")
    check_in_date = models.DateField(verbose_name="Ngày nhận phòng")
    check_out_date = models.DateField(verbose_name="Ngày trả phòng")
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="Tổng tiền (VNĐ)")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING_PAYMENT', verbose_name="Trạng thái thanh toán")
    note = models.TextField(blank=True, verbose_name="Ghi chú thêm")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian tạo")

    def save(self, *args, **kwargs):
        if not self.booking_code:
            self.booking_code = "FS" + uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Mã: {self.booking_code} - {self.user.username} ({self.room.name})"

    class Meta:
        verbose_name = "Đơn đặt phòng"
        verbose_name_plural = "Danh sách đặt phòng"


class BookingServiceDetail(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='services_detail', verbose_name="Đơn đặt phòng")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="Dịch vụ chọn")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số lượng")
    subtotal = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Thành tiền (VNĐ)")

    def save(self, *args, **kwargs):
        self.subtotal = self.service.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service.name} x{self.quantity}"

    class Meta:
        verbose_name = "Chi tiết dịch vụ đi kèm"
        verbose_name_plural = "Chi tiết dịch vụ đi kèm"


class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review', verbose_name="Mã đơn đặt phòng")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name="Khách hàng")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reviews', verbose_name="Phòng")
    rating = models.PositiveIntegerField(default=5, verbose_name="Đánh giá (1-5 sao)")
    comment = models.TextField(verbose_name="Nội dung đánh giá")
    is_deleted = models.BooleanField(default=False, verbose_name="Đã bị ẩn (Bởi Admin)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày gửi")

    def __str__(self):
        return f"Review {self.rating}* - {self.user.username} ({'Đã bị ẩn' if self.is_deleted else 'Hiển thị'})"

    class Meta:
        verbose_name = "Đánh giá (Review)"
        verbose_name_plural = "Quản lý Đánh giá"

