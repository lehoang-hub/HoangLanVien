from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, BungalowViewSet, CustomerViewSet, MotorbikeViewSet

# Khởi tạo Router để tự động sinh ra các đường dẫn chuẩn RESTful
router = DefaultRouter()
router.register(r'bookings', BookingViewSet)
router.register(r'bungalows', BungalowViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'motorbikes', MotorbikeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
