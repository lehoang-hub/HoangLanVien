from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Bookings, Bungalows, Customers, Motorbikes
from .serializers import (
    BookingSerializer,
    BungalowSerializer,
    CustomerSerializer,
    MotorbikeSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import bcrypt
from .models import Users
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Bookings.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

class BungalowViewSet(viewsets.ModelViewSet):
        # Trỏ đến Database, lấy dữ liệu thật và sắp xếp phòng mới thêm lên đầu
        queryset = Bungalows.objects.all().order_by('-id')
        serializer_class = BungalowSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

class MotorbikeViewSet(viewsets.ModelViewSet):
    queryset = Motorbikes.objects.all()
    serializer_class = MotorbikeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CustomLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"detail": "Vui lòng cung cấp email và mật khẩu."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Tìm user trong bảng Laravel cũ
            user = Users.objects.get(email=email)

            # 2. Xử lý thuật toán mật khẩu: Laravel dùng $2y$, Python cần $2b$
            laravel_hash = user.password.replace('$2y$', '$2b$').encode('utf-8')

            # 3. Đối chiếu mật khẩu
            if bcrypt.checkpw(password.encode('utf-8'), laravel_hash):

                # 4. Tạo chìa khóa JWT
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email,
                        'role': user.role
                    }
                })
            else:
                return Response({"detail": "Mật khẩu không chính xác."}, status=status.HTTP_401_UNAUTHORIZED)

        except Users.DoesNotExist:
            return Response({"detail": "Tài khoản không tồn tại."}, status=status.HTTP_401_UNAUTHORIZED)

# Bạn có thể tự copy/paste và đổi tên tương tự cho các Model khác (như User, MenuItems...) nếu cần nhé.
class CustomRegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'customer')  # Mặc định vai trò là khách hàng nếu không truyền lên

        # 1. Kiểm tra dữ liệu đầu vào
        if not name or not email or not password:
            return Response({"detail": "Vui lòng điền đầy đủ tên, email và mật khẩu."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 2. Kiểm tra email đã tồn tại chưa
        if Users.objects.filter(email=email).exists():
            return Response({"detail": "Email này đã được sử dụng."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Băm mật khẩu chuẩn Laravel (Bcrypt)
        # Python mặc định sinh ra mã bắt đầu bằng $2b$
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Đổi $2b$ thành $2y$ để Laravel hệ thống cũ đọc hiểu bình thường
        laravel_hashed_pw = hashed_pw.replace('$2b$', '$2y$')

        # 4. Lưu người dùng mới vào Database
        new_user = Users.objects.create(
            name=name,
            email=email,
            password=laravel_hashed_pw,
            role=role,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        return Response({
            "detail": "Đăng ký tài khoản thành công!",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        }, status=status.HTTP_201_CREATED)
