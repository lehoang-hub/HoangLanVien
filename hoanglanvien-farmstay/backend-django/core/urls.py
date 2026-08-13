from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,)
# 👉 Import API đăng nhập mới
from api.views import CustomLoginView, CustomRegisterView
from django.conf import settings # Thêm dòng này
from django.conf.urls.static import static # Thêm dòng này

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
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
