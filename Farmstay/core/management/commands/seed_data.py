from django.core.management.base import BaseCommand
from core.models import User, Room, Service, Booking, BookingServiceDetail, Review
import datetime

class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu cho Farmstay'

    def handle(self, *args, **kwargs):
        self.stdout.write("Khoi tao du lieu mau...")

        # 1. Admin & Customer Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@farmstay.com',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'phone': '0901234567'
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        customer_user, _ = User.objects.get_or_create(
            username='khachhang',
            defaults={
                'email': 'khach@gmail.com',
                'role': 'CUSTOMER',
                'phone': '0987654321',
                'first_name': 'Nguyễn Văn',
                'last_name': 'A'
            }
        )
        customer_user.set_password('123456')
        customer_user.save()

        # 2. Rooms
        rooms_data = [
            {
                'name': 'Bungalow Gỗ Hương',
                'room_type': 'BUNGALOW',
                'price': 1200000,
                'capacity': 2,
                'description': 'Bungalow gỗ thông thơm ngát giữa vườn cây ăn trái, view đồi thông mộng mơ.',
                'image_url': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
                'status': 'AVAILABLE'
            },
            {
                'name': 'Villa Ven Hồ Hoàng Hôn',
                'room_type': 'VILLA',
                'price': 2500000,
                'capacity': 6,
                'description': 'Villa nguyên căn thiết kế mở sang trọng ngay cạnh hồ nước tự nhiên, thích hợp cho gia đình.',
                'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                'status': 'AVAILABLE'
            },
            {
                'name': 'Phòng Đôi Hướng Vườn',
                'room_type': 'DOUBLE',
                'price': 800000,
                'capacity': 2,
                'description': 'Phòng đôi ấm cúng, thiết kế hiện đại hòa mình cùng thiên nhiên.',
                'image_url': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
                'status': 'AVAILABLE'
            },
            {
                'name': 'Phòng Gia Đình Xanh',
                'room_type': 'FAMILY',
                'price': 1500000,
                'capacity': 4,
                'description': 'Phòng rộng rãi dành cho gia đình 4 người với ban công ngắm toàn cảnh Farmstay.',
                'image_url': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
                'status': 'AVAILABLE'
            }
        ]

        rooms = []
        for r_data in rooms_data:
            room, _ = Room.objects.get_or_create(name=r_data['name'], defaults=r_data)
            rooms.append(room)

        # 3. Services
        services_data = [
            {'service_type': 'FOOD', 'name': 'Gà Nướng Cơm Lam', 'price': 250000, 'unit': 'con', 'image_url': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80'},
            {'service_type': 'FOOD', 'name': 'Lẩu Nấm Rau Rừng', 'price': 300000, 'unit': 'nồi', 'image_url': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80'},
            {'service_type': 'DRINK', 'name': 'Nước Cam Tươi Farmstay', 'price': 35000, 'unit': 'ly', 'image_url': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80'},
            {'service_type': 'DRINK', 'name': 'Cà Phê Moka Nguyên Chất', 'price': 40000, 'unit': 'ly', 'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80'},
            {'service_type': 'MOTORBIKE', 'name': 'Thuê Xe Máy Tay Ga (Vision/AirBlade)', 'price': 150000, 'unit': 'ngày', 'image_url': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80'},
            {'service_type': 'MOTORBIKE', 'name': 'Thuê Xe Máy Số (Wave Alpha)', 'price': 120000, 'unit': 'ngày', 'image_url': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80'}
        ]

        services = []
        for s_data in services_data:
            service, _ = Service.objects.get_or_create(name=s_data['name'], defaults=s_data)
            services.append(service)

        # 4. Sample Booking & Review
        today = datetime.date.today()
        booking, created = Booking.objects.get_or_create(
            booking_code="FS2026DEMO",
            defaults={
                'user': customer_user,
                'room': rooms[0],
                'check_in_date': today - datetime.timedelta(days=3),
                'check_out_date': today - datetime.timedelta(days=1),
                'total_amount': 2400000 + 250000 + 150000,
                'payment_status': 'PAID',
                'note': 'Cần chuẩn bị phòng yên tĩnh.'
            }
        )

        if created:
            BookingServiceDetail.objects.create(booking=booking, service=services[0], quantity=1, subtotal=250000)
            BookingServiceDetail.objects.create(booking=booking, service=services[4], quantity=1, subtotal=150000)

            Review.objects.create(
                booking=booking,
                user=customer_user,
                room=rooms[0],
                rating=5,
                comment="Trải nghiệm vô cùng tuyệt vời! Không khí trong lành, đồ ăn nướng ngon xuất sắc.",
                is_deleted=False
            )

        self.stdout.write(self.style.SUCCESS("Da tao du lieu mau thanh cong!"))
        self.stdout.write("-> Admin: admin / admin123")
        self.stdout.write("-> Customer: khachhang / 123456")

