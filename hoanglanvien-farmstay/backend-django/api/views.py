from django.shortcuts import render
from rest_framework import viewsets
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import MenuItems
from .serializers import MenuItemSerializer
from .models import Bookings, Bungalows, Customers, Motorbikes,MotorbikeBookings
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
from rest_framework.response import Response
from rest_framework import status
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
class MotorbikeBookingViewSet(viewsets.ModelViewSet):
    queryset = MotorbikeBookings.objects.all()
    serializer_class = MotorbikeBookingSerializer
    permission_classes = [AllowAny]

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Bookings.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

class BungalowViewSet(viewsets.ModelViewSet):
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
                    'name': user.username,
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
