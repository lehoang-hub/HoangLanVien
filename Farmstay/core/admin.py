from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Room, Service, Booking, BookingServiceDetail, Review

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin bổ sung Farmstay', {'fields': ('phone', 'role')}),
    )
    actions = ['activate_users', 'deactivate_users']

    @admin.action(description="Kích hoạt (Mở khóa) các tài khoản đã chọn")
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Vô hiệu hóa (Khóa) các tài khoản đã chọn")
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_type', 'price', 'capacity', 'status')
    list_filter = ('room_type', 'status')
    search_fields = ('name', 'description')
    list_editable = ('price', 'status')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_type', 'price', 'unit', 'is_available')
    list_filter = ('service_type', 'is_available')
    search_fields = ('name',)
    list_editable = ('price', 'is_available')


class BookingServiceDetailInline(admin.TabularInline):
    model = BookingServiceDetail
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'user', 'room', 'check_in_date', 'check_out_date', 'total_amount', 'payment_status', 'created_at')
    list_filter = ('payment_status', 'check_in_date', 'check_out_date')
    search_fields = ('booking_code', 'user__username', 'room__name')
    inlines = [BookingServiceDetailInline]
    actions = ['mark_as_paid', 'mark_as_cancelled']

    @admin.action(description="Đánh dấu đã thanh toán (PAID)")
    def mark_as_paid(self, request, queryset):
        queryset.update(payment_status='PAID')

    @admin.action(description="Đánh dấu đã hủy (CANCELLED)")
    def mark_as_cancelled(self, request, queryset):
        queryset.update(payment_status='CANCELLED')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('booking', 'user', 'room', 'rating', 'short_comment', 'is_deleted', 'created_at')
    list_filter = ('rating', 'is_deleted', 'created_at')
    search_fields = ('comment', 'user__username', 'room__name')
    actions = ['hide_reviews', 'restore_reviews']

    def has_add_permission(self, request):
        # Admin chỉ được đọc và ẩn/xóa đánh giá thực tế của khách hàng, không được tự tạo đánh giá giả
        return False

    def short_comment(self, obj):
        return obj.comment[:50] + "..." if len(obj.comment) > 50 else obj.comment
    short_comment.short_description = "Nội dung"

    @admin.action(description="Ẩn / Xóa bài đánh giá (Vi phạm/Spam)")
    def hide_reviews(self, request, queryset):
        queryset.update(is_deleted=True)

    @admin.action(description="Khôi phục hiển thị đánh giá")
    def restore_reviews(self, request, queryset):
        queryset.update(is_deleted=False)


