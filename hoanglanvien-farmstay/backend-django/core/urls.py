from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,)
# 👉 Import API đăng nhập mới
from api.views import CustomLoginView, CustomRegisterView

urlpatterns = [
    path('admin/', admin.site.urls),

    # 👉 Sử dụng API Đăng nhập tùy chỉnh
    path('api/token/', CustomLoginView.as_view(), name='custom_login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', CustomRegisterView.as_view(), name='custom_register'),
    # Các đường dẫn dữ liệu cũ của bạn
    path('api/', include('api.urls')),
    path('', RedirectView.as_view(url='api/')),
]

