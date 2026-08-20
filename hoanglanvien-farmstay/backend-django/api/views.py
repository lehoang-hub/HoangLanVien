from django.shortcuts import render
from rest_framework import viewsets
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import MenuItems
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import IsAdminUser # Chỉ cho phép Admin
from .serializers import MenuItemSerializer
from .models import Bookings, Bungalows, Customers, Motorbikes, MotorbikeBookings
from .serializers import (
    BookingSerializer,
    BungalowSerializer,
    CustomerSerializer,
    MotorbikeSerializer,
)
from .models import FoodOrders
from .models import Galleries # (Hoặc tên model thực tế của bạn trong models.py)
from rest_framework import serializers
from .serializers import FoodOrderSerializer
from rest_framework.views import APIView
from .models import UserProfile, Bookings, Review


from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from .serializers import MotorbikeBookingSerializer
from rest_framework import serializers, viewsets
from .models import Introduction
from .serializers import IntroductionSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.core.files.storage import default_storage

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

class IntroductionViewSet(viewsets.ModelViewSet):
    queryset = Introduction.objects.all().order_by('-id')
    serializer_class = IntroductionSerializer
    permission_classes = [AllowAny]
class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Galleries # Tên Model tương ứng trong database
        fields = '__all__'

# 2. Tạo ViewSet để cung cấp các API GET, POST, DELETE
class GalleryViewSet(viewsets.ModelViewSet):
    queryset = Galleries.objects.all().order_by('-id')
    serializer_class = GallerySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        import os
        import time
        import uuid
        from django.core.files.storage import FileSystemStorage
        from django.conf import settings
        from django.utils import timezone
        from django.db import connection  # 🟢 Thêm thư viện để chạy SQL thuần

        try:
            raw_title = request.data.get('title', f"Banner_{int(time.time())}")
            if isinstance(raw_title, list): raw_title = raw_title[0]
            raw_title = str(raw_title).strip()[:190]

            uploaded_file = request.FILES.get('file_path')
            if not uploaded_file:
                return Response({"detail": "Thiếu file ảnh!"}, status=status.HTTP_400_BAD_REQUEST)

            # Khởi tạo thư mục và lưu file vật lý
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'galleries')
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir, exist_ok=True)

            fs = FileSystemStorage(location=upload_dir)
            ext = os.path.splitext(uploaded_file.name)[1]
            safe_filename = f"banner_{int(time.time())}_{str(uuid.uuid4())[:4]}{ext}"
            saved_name = fs.save(safe_filename, uploaded_file)
            db_path = f"galleries/{saved_name}"
            new_gallery = Galleries.objects.create(
                title=str(raw_title)[:190],
                type='image',  # Giúp lọt qua khe cửa Database an toàn 100%
                video_url='hero',  # Đánh dấu đây là ảnh Slider
                file_path=db_path,
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            now = timezone.now()

            # 🟢 GIẢI PHÁP TỐI THƯỢNG: SỬ DỤNG RAW SQL ĐỂ ÉP GHI VÀO DATABASE
            # Bỏ qua hoàn toàn Django ORM, ép dữ liệu vào đúng vị trí từng cột
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO galleries (title, `type`, file_path, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    [raw_title, 'hero', db_path, now, now]
                )
                new_id = cursor.lastrowid

            return Response({'id': new_id, 'detail': 'Upload thành công!'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": f"Chi tiết lỗi MySQL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class MotorbikeBookingViewSet(viewsets.ModelViewSet):
    queryset = MotorbikeBookings.objects.all()
    serializer_class = MotorbikeBookingSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data
        from django.utils import timezone  # Bổ sung để chắc chắn luôn gọi được thời gian

        try:
            email = data.get('customer_email')
            phone = data.get('customer_phone', '')
            name = data.get('customer_name', 'Khách hàng')

            # Hỗ trợ nhận cả 'motorbike_id' hoặc 'motorbike' từ Frontend
            motorbike_id = data.get('motorbike_id') or data.get('motorbike')
            check_in = data.get('check_in_date')
            check_out = data.get('check_out_date')
            total_amount = data.get('total_amount', 0)

            # Tạo mã đơn đặt xe riêng biệt (Bắt đầu bằng MX - Motorbike)
            booking_code = data.get('booking_code', f"MX{timezone.now().strftime('%Y%m%d%H%M%S')}")
            notes = data.get('notes', '')

            # ==========================================
            # 🟢 BƯỚC 1: BẢO VỆ DỮ LIỆU ĐẦU VÀO
            # ==========================================
            if not check_in or not check_out or not motorbike_id:
                return Response({"detail": "Thiếu thông tin ngày thuê, ngày trả hoặc ID xe máy!"},
                                status=status.HTTP_400_BAD_REQUEST)

            # ==========================================
            # 🟢 BƯỚC 2: CHỐT CHẶN KIỂM TRA OVERBOOKING XE MÁY
            # ==========================================
            is_overlapping = MotorbikeBookings.objects.filter(
                motorbike_id=motorbike_id
            ).exclude(
                status='cancelled'  # Không tính các đơn đã hủy
            ).filter(
                check_in_date__lt=check_out,  # In mới < Out cũ
                check_out_date__gt=check_in  # Out mới > In cũ
            ).exists()

            if is_overlapping:
                return Response({
                    "detail": "Rất tiếc! Chiếc xe này đã có khách thuê trong khoảng thời gian bạn chọn. Vui lòng chọn ngày hoặc xe khác."
                }, status=status.HTTP_400_BAD_REQUEST)

            # ==========================================
            # 🟢 BƯỚC 3: XỬ LÝ THÔNG TIN KHÁCH HÀNG & TẠO ĐƠN
            # ==========================================
            customer_obj = None
            if phone:
                customer_obj = Customers.objects.filter(phone=phone).first()
            if not customer_obj and email:
                customer_obj = Customers.objects.filter(email=email).first()

            if not customer_obj:
                customer_obj = Customers.objects.create(
                    full_name=name,
                    phone=phone if phone else f"UP{timezone.now().strftime('%H%M%S')}",
                    email=email
                )
            else:
                customer_obj.full_name = name
                if email:
                    customer_obj.email = email
                customer_obj.save()

            # Lưu đơn hàng vào bảng MotorbikeBookings
            new_booking = MotorbikeBookings.objects.create(
                booking_code=booking_code,
                customer_id=customer_obj.id,  # Lưu ý: Bảng này thiết kế dùng customer_id
                motorbike_id=motorbike_id,
                check_in_date=check_in,
                check_out_date=check_out,
                total_amount=total_amount,
                notes=notes,
                status='pending',
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            # Trả về kết quả cho Frontend hiển thị
            return Response({
                "id": new_booking.id,
                "booking_code": new_booking.booking_code,
                "motorbike_id": new_booking.motorbike_id,
                "check_in_date": new_booking.check_in_date,
                "check_out_date": new_booking.check_out_date,
                "total_amount": new_booking.total_amount,
                "status": new_booking.status,
                "detail": "Đặt thuê xe thành công!"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("❌ LỖI ĐẶT XE THỰC TẾ:", str(e))
            return Response({"detail": f"Lỗi máy chủ: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Bookings.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data

        try:
            email = data.get('customer_email')
            phone = data.get('customer_phone', '')
            name = data.get('customer_name', 'Khách hàng')

            bungalow_id = data.get('bungalow_id') or data.get('bungalow')
            check_in = data.get('check_in_date')
            check_out = data.get('check_out_date')
            total_amount = data.get('total_amount', 0)
            total_guests = data.get('total_guests', 1)
            booking_code = data.get('booking_code', f"BK{timezone.now().strftime('%Y%m%d%H%M%S')}")
            notes = data.get('notes', '')

            # ==========================================
            # 🟢 BƯỚC 1: BẢO VỆ DỮ LIỆU ĐẦU VÀO
            # ==========================================
            if not check_in or not check_out or not bungalow_id:
                return Response({"detail": "Thiếu thông tin ngày nhận/trả hoặc ID phòng!"}, status=status.HTTP_400_BAD_REQUEST)

            # ==========================================
            # 🟢 BƯỚC 2: CHỐT CHẶN KIỂM TRA OVERBOOKING
            # ==========================================
            # Truy vấn Database xem phòng này có đang dính lịch nào không (bỏ qua các đơn đã Hủy)
            is_overlapping = Bookings.objects.filter(
                bungalow_id=bungalow_id
            ).exclude(
                status='cancelled'
            ).filter(
                check_in_date__lt=check_out,  # In mới < Out cũ
                check_out_date__gt=check_in   # Out mới > In cũ
            ).exists()

            if is_overlapping:
                # Trả về mã lỗi 400 để Frontend hiển thị thông báo ngay lập tức
                return Response({
                    "detail": "Rất tiếc! Phòng này đã có khách đặt trong khoảng thời gian bạn chọn. Hệ thống vừa cập nhật, vui lòng chọn ngày khác."
                }, status=status.HTTP_400_BAD_REQUEST)

            # ==========================================
            # 🟢 BƯỚC 3: TIẾN HÀNH TẠO ĐƠN VÀ KHÁCH HÀNG
            # ==========================================
            customer_obj = None
            if phone:
                customer_obj = Customers.objects.filter(phone=phone).first()
            if not customer_obj and email:
                customer_obj = Customers.objects.filter(email=email).first()

            if not customer_obj:
                customer_obj = Customers.objects.create(
                    full_name=name,
                    phone=phone if phone else f"UP{timezone.now().strftime('%H%M%S')}",
                    email=email
                )
            else:
                customer_obj.full_name = name
                if email:
                    customer_obj.email = email
                customer_obj.save()

            # Lưu đơn hàng vào bảng Bookings
            new_booking = Bookings.objects.create(
                booking_code=booking_code,
                customer=customer_obj,
                bungalow_id=bungalow_id,
                check_in_date=check_in,
                check_out_date=check_out,
                total_guests=total_guests,
                total_amount=total_amount,
                notes=notes,
                status='pending',
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            # Trả về để React hiển thị
            return Response({
                "id": new_booking.id,
                "booking_code": new_booking.booking_code,
                "bungalow": new_booking.bungalow_id,
                "check_in_date": new_booking.check_in_date,
                "check_out_date": new_booking.check_out_date,
                "total_amount": new_booking.total_amount,
                "status": new_booking.status,
                "detail": "Đặt phòng thành công!"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("❌ LỖI ĐẶT PHÒNG THỰC TẾ:", str(e))
            return Response({"detail": f"Lỗi máy chủ: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class BungalowViewSet(viewsets.ModelViewSet):
    queryset = Bungalows.objects.all().order_by('-id')
    serializer_class = BungalowSerializer
    permission_classes = [AllowAny]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

class MotorbikeViewSet(viewsets.ModelViewSet):
    queryset = Motorbikes.objects.all()
    serializer_class = MotorbikeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"detail": "Vui lòng cung cấp email và mật khẩu."}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        # 1. Tự động nhận diện người dùng nhập vào là Email hay Username
        if '@' in email:
            try:
                matched_user = User.objects.get(email=email)
                user = authenticate(username=matched_user.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=email, password=password)

        # 2. Đối chiếu và cấp Token JWT chuẩn Django
        if user is not None:
            refresh = RefreshToken.for_user(user)

            # Ép kiểu role: Superuser là admin, còn lại là customer
            user_role = 'admin' if user.is_superuser else 'customer'

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'name': user.first_name if user.first_name else user.username,
                    'email': user.email,
                    'role': user_role
                }
            })
        else:
            return Response({"detail": "Tài khoản hoặc mật khẩu không chính xác."}, status=status.HTTP_401_UNAUTHORIZED)


class CustomRegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name', '') # 🟢 Phải lấy đúng chữ 'name' từ React gửi lên
        phone = request.data.get('phone', '') # 🟢 Lấy 'phone' từ React

        if User.objects.filter(username=email).exists():
            return Response({'detail': 'Email đã được sử dụng!'}, status=status.HTTP_400_BAD_REQUEST)
        if phone and Customers.objects.filter(phone=phone).exists():
            return Response({'detail': 'Số điện thoại này đã được đăng ký bởi tài khoản khác!'},
                            status=status.HTTP_400_BAD_REQUEST)

        # 🟢 Tạo User và lưu Tên thẳng vào cột first_name
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name
        )

        # 🟢 Lưu Số điện thoại vào bảng Profile
        if hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.save()
        if phone:
            Customers.objects.get_or_create(
                phone=phone,
                defaults={'email': email, 'full_name': name}
            )
        try:
            subject = 'Chào mừng bạn đến với Hoàng Hân FarmStay!'
            message = f'Xin chào {name},\n\nCảm ơn bạn đã đăng ký tài khoản tại Hoàng Hân FarmStay. Tài khoản của bạn ({email}) đã được tạo thành công.\n\nChúc bạn có một kỳ nghỉ tuyệt vời!'
            from_email = 'email.cua.ban@gmail.com'
            recipient_list = [email]
            send_mail(subject, message, from_email, recipient_list, fail_silently=True)
        except Exception as e:
            print("Lỗi không gửi được mail:", e)

        return Response({'detail': 'Đăng ký thành công'}, status=status.HTTP_201_CREATED)


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItems.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

    # Hàm này giúp Django hiểu và lọc ra danh sách khi React gọi ?type=food
    def get_queryset(self):
        queryset = super().get_queryset()
        item_type = self.request.query_params.get('type')
        if item_type:
            queryset = queryset.filter(type=item_type)
        return queryset
class FoodOrderViewSet(viewsets.ModelViewSet):
    queryset = FoodOrders.objects.all().order_by('-created_at')
    serializer_class = FoodOrderSerializer


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]  # Bắt buộc phải có token của Admin

    def get(self, request):
        # Lấy tất cả user (trừ superuser để tránh admin tự khóa chính mình)
        users = User.objects.filter(is_superuser=False).order_by('-date_joined')
        data = []
        for user in users:
            # Lấy số điện thoại từ bảng Profile đã liên kết
            phone = user.profile.phone if hasattr(user, 'profile') else 'Chưa cập nhật'
            data.append({
                'id': user.id,
                'name': user.first_name or user.username,
                'email': user.email,
                'phone': phone,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime("%Y-%m-%d %H:%M:%S")
            })
        return Response(data)


class AdminUserStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_superuser=False)
            action = request.data.get('action')  # 'suspend' (khóa), 'ban' (cấm hẳn), 'unlock' (mở)

            if action in ['suspend', 'ban']:
                user.is_active = False  # Khóa tài khoản
                # Nếu muốn phân biệt khóa tạm/vĩnh viễn, bạn có thể lưu thêm Note vào UserProfile
            elif action == 'unlock':
                user.is_active = True  # Mở khóa

            user.save()
            return Response({'detail': 'Cập nhật trạng thái thành công!', 'is_active': user.is_active})
        except User.DoesNotExist:
            return Response({'detail': 'Không tìm thấy người dùng!'}, status=status.HTTP_404_NOT_FOUND)


class ReviewListCreateView(APIView):
    def get(self, request):
        reviews = Review.objects.all().order_by('-created_at')
        data = []
        total_rating = 0
        count = reviews.count()

        for r in reviews:
            total_rating += r.rating
            data.append({
                'id': r.id,
                'user_name': r.user.first_name or r.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at
            })

        average_rating = round(total_rating / count, 1) if count > 0 else 0.0

        return Response({
            'average_rating': average_rating,
            'total_reviews': count,
            'reviews': data  # Trả về list review trong key 'reviews'
        })

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Chưa đăng nhập!"}, status=status.HTTP_401_UNAUTHORIZED)

        # Đếm số lượng đơn hàng đã hoàn tất
        completed_bookings = Bookings.objects.filter(
            customer__email=request.user.email,
            status__in=['checked_out', 'completed']
        ).count()

        # Đếm số lượng đánh giá người dùng đã viết
        user_reviews = Review.objects.filter(user=request.user).count()

        # 🟢 LOGIC: 1 Booking đã check_out = 1 lượt Review
        if user_reviews >= completed_bookings:
            return Response(
                {"detail": "Bạn đã hết lượt đánh giá. Hãy đặt thêm phòng và trải nghiệm để tiếp tục đánh giá nhé!"},
                status=status.HTTP_403_FORBIDDEN)

        rating = int(request.data.get('rating', 5))
        comment = request.data.get('comment', '')

        Review.objects.create(user=request.user, rating=rating, comment=comment)
        return Response({"detail": "Gửi đánh giá thành công!"}, status=status.HTTP_201_CREATED)


class CheckReviewEligibilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Đếm đơn hàng hoàn tất
        completed_bookings = Bookings.objects.filter(
            customer__email=request.user.email,
            status__in=['checked_out', 'completed']
        ).count()

        # Lấy các bài đánh giá user đã viết
        user_reviews = Review.objects.filter(user=request.user).order_by('-created_at')
        reviews_count = user_reviews.count()

        # Còn lượt khi số đơn > số đánh giá
        eligible = completed_bookings > reviews_count

        my_reviews = []
        for r in user_reviews:
            my_reviews.append({
                'id': r.id,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at.strftime("%d/%m/%Y %H:%M")
            })

        # Trả về cả điều kiện lẫn danh sách bài đã viết
        return Response({
            "eligible": eligible,
            "remaining_reviews": completed_bookings - reviews_count,
            "my_reviews": my_reviews
        })


class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 🟢 ĐÃ SỬA LỖI 500: Lọc đơn hàng dựa trên email của bảng Customers
        bookings = Bookings.objects.filter(customer__email=request.user.email).order_by('-created_at')
        data = []
        for b in bookings:
            data.append({
                'id': b.id,
                'booking_code': b.booking_code,
                'bungalow': b.bungalow_id, # 🟢 ĐÃ SỬA: Lấy trực tiếp ID phòng từ cột bungalow_id
                'check_in_date': b.check_in_date,
                'check_out_date': b.check_out_date,
                'total_amount': b.total_amount,
                'status': b.status,
            })
        return Response(data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({"detail": "Mật khẩu cũ không chính xác!"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Đổi mật khẩu thành công!"}, status=status.HTTP_200_OK)


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            user = request.user
            name = request.data.get('name')
            phone = request.data.get('phone')
            avatar = request.FILES.get('avatar')

            if name:
                user.first_name = name
                user.save()

            # Lấy hoặc tạo mới UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)

            if phone:
                # 🟢 Kiểm tra xem số điện thoại mới có bị trùng với người khác trong bảng Customers không
                existing_customer = Customers.objects.filter(phone=phone).exclude(email=user.email).first()
                if existing_customer:
                    return Response({"detail": "Số điện thoại này đã được sử dụng bởi tài khoản khác!"},
                                    status=status.HTTP_400_BAD_REQUEST)

                profile.phone = phone

                # Đồng bộ sang bảng Customers dựa theo email của tài khoản
                customer_obj, _ = Customers.objects.get_or_create(
                    email=user.email,
                    defaults={'full_name': user.first_name or user.username, 'phone': phone}
                )
                customer_obj.phone = phone
                if name:
                    customer_obj.full_name = name
                customer_obj.save()

            if avatar:
                profile.avatar = avatar

            profile.save()

            avatar_url = None
            if profile.avatar and hasattr(profile.avatar, 'url'):
                try:
                    avatar_url = request.build_absolute_uri(profile.avatar.url)
                except Exception:
                    pass

            return Response({
                'id': user.id,
                'name': user.first_name or user.username,
                'email': user.email,
                'phone': profile.phone,
                'avatar': avatar_url
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ Lỗi khi cập nhật Profile:", str(e))
            return Response({"detail": f"Lỗi máy chủ: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
