from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (BookingViewSet, BungalowViewSet, CustomerViewSet, MotorbikeViewSet,
                    MotorbikeBookingViewSet )
from .views import (MenuItemViewSet, GalleryViewSet)
from django.conf import settings
from django.conf.urls.static import static
from .views import FoodOrderViewSet
from .views import IntroductionViewSet
from .views import AdminUserListView, AdminUserStatusView
from .views import ReviewListCreateView, CheckReviewEligibilityView
from .views import MyBookingsView, ChangePasswordView, UserProfileUpdateView

# Khởi tạo Router chính cho API
router = DefaultRouter()
router.register(r'bookings', BookingViewSet)
router.register(r'bungalows', BungalowViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'motorbikes', MotorbikeViewSet)
router.register(r'motorbike-bookings', MotorbikeBookingViewSet, basename='motorbike-bookings')
router.register(r'menu-items', MenuItemViewSet, basename='menu-items')
router.register(r'food-orders', FoodOrderViewSet, basename='food-orders')
router.register(r'galleries', GalleryViewSet, basename='galleries')
router.register(r'introductions', IntroductionViewSet, basename='introductions')

urlpatterns = [
    # 1. Các Custom API dành riêng cho Client & User Profile
    path('bookings/my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
    path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('user/profile/update/', UserProfileUpdateView.as_view(), name='profile-update'),
    path('reviews/', ReviewListCreateView.as_view(), name='reviews'),
    path('reviews/check-eligibility/', CheckReviewEligibilityView.as_view(), name='check-eligibility'),

    # 2. Các API quản lý dành cho Admin
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/status/', AdminUserStatusView.as_view(), name='admin_user_status'),
    path('admin/', include(router.urls)),
    # 3. Router RESTful chính (Cung cấp toàn bộ /api/bungalows/, /api/introductions/,...)
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
