from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, BungalowViewSet, CustomerViewSet, MotorbikeViewSet
from django.conf import settings
from django.conf.urls.static import static

# Khởi tạo Router để tự động sinh ra các đường dẫn chuẩn RESTful
router = DefaultRouter()
router.register(r'bookings', BookingViewSet)
router.register(r'bungalows', BungalowViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'motorbikes', MotorbikeViewSet)

urlpatterns = [
    # 1. Đường dẫn này phục vụ trang Client (ví dụ: /api/bungalows/)
    path('', include(router.urls)),

    # 2. Đường dẫn này phục vụ trang Admin (ví dụ: /api/admin/bungalows/)
    path('admin/', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
