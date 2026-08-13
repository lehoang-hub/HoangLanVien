from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('rooms/', views.room_list_view, name='room_list'),
    path('rooms/<int:room_id>/', views.room_detail_view, name='room_detail'),
    path('rooms/<int:room_id>/book/', views.booking_create_view, name='booking_create'),
    path('motorbikes/', views.motorbike_list_view, name='motorbike_list'),
    path('menu/', views.menu_list_view, name='menu_list'),
    path('payment/<int:booking_id>/', views.payment_page_view, name='payment_page'),
    path('payment/<int:booking_id>/confirm/', views.payment_confirm_view, name='payment_confirm'),
    path('my-bookings/', views.booking_history_view, name='booking_history'),
    path('review/<int:booking_id>/', views.review_create_view, name='review_create'),
    path('dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('dashboard/review/<int:review_id>/toggle/', views.admin_toggle_review_view, name='admin_toggle_review'),
    path('dashboard/user/<int:user_id>/toggle/', views.admin_toggle_user_view, name='admin_toggle_user'),
    path('dashboard/booking/<int:booking_id>/status/', views.admin_update_booking_status_view, name='admin_update_booking_status'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]


