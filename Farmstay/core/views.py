import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth, TruncDay
from django.core.mail import send_mail
from django.conf import settings
from .models import User, Room, Service, Booking, BookingServiceDetail, Review

def index_view(request):
    featured_rooms = Room.objects.filter(status='AVAILABLE')[:3]
    services = Service.objects.filter(is_available=True)[:4]
    # Filter reviews where is_deleted is False (as specified in Task 1.1 of SRS)
    reviews = Review.objects.filter(is_deleted=False).select_related('user', 'room').order_by('-created_at')[:5]
    
    context = {
        'featured_rooms': featured_rooms,
        'services': services,
        'reviews': reviews,
    }
    return render(request, 'core/index.html', context)


def room_list_view(request):
    check_in = request.GET.get('check_in')
    check_out = request.GET.get('check_out')
    room_type = request.GET.get('room_type')
    capacity = request.GET.get('capacity')

    rooms = Room.objects.filter(status='AVAILABLE')

    if room_type:
        rooms = rooms.filter(room_type=room_type)
    if capacity:
        try:
            rooms = rooms.filter(capacity__gte=int(capacity))
        except ValueError:
            pass

    if check_in and check_out:
        try:
            c_in = datetime.datetime.strptime(check_in, '%Y-%m-%d').date()
            c_out = datetime.datetime.strptime(check_out, '%Y-%m-%d').date()
            
            if c_in < c_out:
                # Logic exclude rooms already booked in overlapping dates
                booked_room_ids = Booking.objects.filter(
                    payment_status__in=['PENDING_PAYMENT', 'PAID'],
                    check_in_date__lt=c_out,
                    check_out_date__gt=c_in
                ).values_list('room_id', flat=True)

                rooms = rooms.exclude(id__in=booked_room_ids)
            else:
                messages.error(request, 'Ngày trả phòng phải sau ngày nhận phòng.')
        except ValueError:
            pass

    context = {
        'rooms': rooms,
        'check_in': check_in or '',
        'check_out': check_out or '',
        'room_type': room_type or '',
        'capacity': capacity or '',
        'room_types': Room.ROOM_TYPE_CHOICES,
    }
    return render(request, 'core/room_list.html', context)


def room_detail_view(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    food_services = Service.objects.filter(service_type__in=['FOOD', 'DRINK'], is_available=True)
    motorbike_services = Service.objects.filter(service_type='MOTORBIKE', is_available=True)
    reviews = Review.objects.filter(room=room, is_deleted=False).select_related('user').order_by('-created_at')

    context = {
        'room': room,
        'food_services': food_services,
        'motorbike_services': motorbike_services,
        'reviews': reviews,
    }
    return render(request, 'core/room_detail.html', context)


@login_required
def booking_create_view(request, room_id):
    room = get_object_or_404(Room, id=room_id)

    if request.method == 'POST':
        check_in_str = request.POST.get('check_in')
        check_out_str = request.POST.get('check_out')
        note = request.POST.get('note', '')

        if not check_in_str or not check_out_str:
            messages.error(request, 'Vui lòng chọn ngày nhận phòng và ngày trả phòng.')
            return redirect('room_detail', room_id=room.id)

        try:
            c_in = datetime.datetime.strptime(check_in_str, '%Y-%m-%d').date()
            c_out = datetime.datetime.strptime(check_out_str, '%Y-%m-%d').date()
            
            if c_in >= c_out or c_in < datetime.date.today():
                messages.error(request, 'Khoảng thời gian đặt phòng không hợp lệ.')
                return redirect('room_detail', room_id=room.id)

            nights = (c_out - c_in).days
            room_total = room.price * nights

            # Concurrency & Row-level Locking implementation (SRS Non-functional Requirement)
            with transaction.atomic():
                # Lock row of room to prevent double booking race condition
                target_room = Room.objects.select_for_update().get(id=room.id)
                
                # Check overlapping bookings
                conflict = Booking.objects.filter(
                    room=target_room,
                    payment_status__in=['PENDING_PAYMENT', 'PAID'],
                    check_in_date__lt=c_out,
                    check_out_date__gt=c_in
                ).exists()

                if conflict:
                    messages.error(request, 'Rất tiếc! Phòng đã được khách khác chọn trong thời gian này.')
                    return redirect('room_list')

                # Create booking record
                booking = Booking.objects.create(
                    user=request.user,
                    room=target_room,
                    check_in_date=c_in,
                    check_out_date=c_out,
                    total_amount=room_total,
                    payment_status='PENDING_PAYMENT',
                    note=note
                )

                # Process additional services
                service_ids = request.POST.getlist('services')
                services_total = 0
                for s_id in service_ids:
                    qty_str = request.POST.get(f'qty_{s_id}', 1)
                    try:
                        qty = max(1, int(qty_str))
                        service_obj = Service.objects.get(id=s_id, is_available=True)
                        subtotal = service_obj.price * qty
                        BookingServiceDetail.objects.create(
                            booking=booking,
                            service=service_obj,
                            quantity=qty,
                            subtotal=subtotal
                        )
                        services_total += subtotal
                    except (Service.DoesNotExist, ValueError):
                        pass

                booking.total_amount += services_total
                booking.save()

            messages.success(request, f'Đã khởi tạo đơn đặt phòng {booking.booking_code}. Vui lòng hoàn tất thanh toán.')
            return redirect('payment_page', booking_id=booking.id)

        except Exception as e:
            messages.error(request, f'Đã có lỗi xảy ra: {str(e)}')
            return redirect('room_detail', room_id=room.id)

    return redirect('room_detail', room_id=room.id)


@login_required
def payment_page_view(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    service_details = booking.services_detail.select_related('service').all()

    context = {
        'booking': booking,
        'service_details': service_details,
    }
    return render(request, 'core/payment.html', context)


@login_required
def payment_confirm_view(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)

    if booking.payment_status != 'PAID':
        booking.payment_status = 'PAID'
        booking.save()

        # Send confirmation email (Console backend setup)
        try:
            subject = f"[Farmstay] Xác nhận Đặt Phòng Thành Công - Mã {booking.booking_code}"
            message = f"""
Xin chào {booking.user.username},

Cảm ơn bạn đã hoàn tất thanh toán cho đơn đặt phòng tại Farmstay!

Chi tiết đơn hàng:
- Mã đặt phòng: {booking.booking_code}
- Phòng: {booking.room.name}
- Thời gian: {booking.check_in_date.strftime('%d/%m/%Y')} -> {booking.check_out_date.strftime('%d/%m/%Y')}
- Tổng tiền đã thanh toán: {booking.total_amount:,.0f} VNĐ

Chúc bạn có một kỳ nghỉ thật tuyệt vời!
Thân ái,
Đội ngũ Quản lý Farmstay.
            """
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@farmstay.com',
                [booking.user.email or 'customer@farmstay.com'],
                fail_silently=True
            )
        except Exception:
            pass

        messages.success(request, 'Thanh toán thành công! Email xác nhận đã được gửi cho bạn.')

    return render(request, 'core/payment_success.html', {'booking': booking})


@login_required
def booking_history_view(request):
    bookings = Booking.objects.filter(user=request.user).select_related('room').prefetch_related('services_detail__service').order_by('-created_at')
    return render(request, 'core/booking_history.html', {'bookings': bookings})


@login_required
def review_create_view(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user, payment_status='PAID')
    
    if hasattr(booking, 'review'):
        messages.info(request, 'Bạn đã gửi đánh giá cho đơn đặt phòng này rồi.')
        return redirect('booking_history')

    if request.method == 'POST':
        rating = request.POST.get('rating', 5)
        comment = request.POST.get('comment', '')

        Review.objects.create(
            booking=booking,
            user=request.user,
            room=booking.room,
            rating=int(rating),
            comment=comment,
            is_deleted=False
        )
        messages.success(request, 'Cảm ơn bạn đã gửi đánh giá cho Farmstay!')
        return redirect('booking_history')

    return render(request, 'core/review_form.html', {'booking': booking})


def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, 'Mật khẩu xác nhận không khớp.')
            return render(request, 'core/register.html')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Tên đăng nhập đã tồn tại.')
            return render(request, 'core/register.html')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            phone=phone,
            role='CUSTOMER'
        )
        login(request, user)
        messages.success(request, 'Đăng ký tài khoản thành công!')
        return redirect('index')

    return render(request, 'core/register.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            if not user.is_active:
                messages.error(request, 'Tài khoản của bạn đã bị quản trị viên tạm khóa.')
                return render(request, 'core/login.html')

            login(request, user)
            messages.success(request, f'Chào mừng {user.username} quay trở lại!')
            return redirect('index')
        else:
            messages.error(request, 'Tên đăng nhập hoặc mật khẩu không chính xác.')

    return render(request, 'core/login.html')


def logout_view(request):
    logout(request)
    messages.info(request, 'Bạn đã đăng xuất khỏi hệ thống.')
    return redirect('index')


def motorbike_list_view(request):
    motorbikes = Service.objects.filter(service_type='MOTORBIKE', is_available=True)
    return render(request, 'core/motorbike_list.html', {'motorbikes': motorbikes})


from django.db.models import Q, Sum, Count

def menu_list_view(request):
    foods = Service.objects.filter(service_type='FOOD', is_available=True)
    drinks = Service.objects.filter(service_type='DRINK', is_available=True)
    return render(request, 'core/menu_list.html', {'foods': foods, 'drinks': drinks})


@login_required
def admin_dashboard_view(request):
    if not (request.user.is_staff or request.user.role == 'ADMIN'):
        messages.error(request, 'Bạn không có quyền truy cập trang Quản Trị.')
        return redirect('index')

    # KPI Statistics
    paid_bookings = Booking.objects.filter(payment_status='PAID')
    total_revenue = paid_bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0

    total_bookings_count = Booking.objects.count()
    pending_bookings_count = Booking.objects.filter(payment_status='PENDING_PAYMENT').count()
    paid_bookings_count = paid_bookings.count()
    cancelled_bookings_count = Booking.objects.filter(payment_status='CANCELLED').count()

    available_rooms_count = Room.objects.filter(status='AVAILABLE').count()
    maintenance_rooms_count = Room.objects.filter(status='MAINTENANCE').count()
    total_users_count = User.objects.filter(role='CUSTOMER').count()

    # Data lists
    recent_bookings = Booking.objects.select_related('user', 'room').order_by('-created_at')[:10]
    all_reviews = Review.objects.select_related('user', 'room', 'booking').order_by('-created_at')
    all_users = User.objects.order_by('-date_joined')

    context = {
    'total_revenue': total_revenue,
    'total_bookings_count': total_bookings_count,
    'pending_bookings_count': pending_bookings_count,
    'paid_bookings_count': paid_bookings_count,
    'cancelled_bookings_count': cancelled_bookings_count,
    'available_rooms_count': available_rooms_count,
    'maintenance_rooms_count': maintenance_rooms_count,
    'total_users_count': total_users_count,
    'recent_bookings': recent_bookings,
    'all_reviews': all_reviews,
    'all_users': all_users,
    # Revenue chart data
    'revenue_monthly': list(
        Booking.objects.filter(payment_status='PAID')
        .annotate(month=TruncMonth('check_in_date'))
        .values('month')
        .annotate(revenue=Sum('total_amount'))
        .order_by('month')
    ),
    'revenue_daily': list(
        Booking.objects.filter(payment_status='PAID')
        .annotate(day=TruncDay('check_in_date'))
        .values('day')
        .annotate(revenue=Sum('total_amount'))
        .order_by('day')
    ),
}
        'total_revenue': total_revenue,
        'total_bookings_count': total_bookings_count,
        'pending_bookings_count': pending_bookings_count,
        'paid_bookings_count': paid_bookings_count,
        'cancelled_bookings_count': cancelled_bookings_count,
        'available_rooms_count': available_rooms_count,
        'maintenance_rooms_count': maintenance_rooms_count,
        'total_users_count': total_users_count,
        'recent_bookings': recent_bookings,
        'all_reviews': all_reviews,
        'all_users': all_users,
    }
    return render(request, 'core/admin_dashboard.html', context)


@login_required
def admin_toggle_review_view(request, review_id):
    if not (request.user.is_staff or request.user.role == 'ADMIN'):
        messages.error(request, 'Bạn không có quyền thực hiện thao tác này.')
        return redirect('index')

    review = get_object_or_404(Review, id=review_id)
    review.is_deleted = not review.is_deleted
    review.save()

    status_str = "ẨN (Xóa)" if review.is_deleted else "HIỂN THỊ"
    messages.success(request, f'Đã chuyển trạng thái đánh giá thành: {status_str}.')
    return redirect('admin_dashboard')


@login_required
def admin_toggle_user_view(request, user_id):
    if not (request.user.is_staff or request.user.role == 'ADMIN'):
        messages.error(request, 'Bạn không có quyền thực hiện thao tác này.')
        return redirect('index')

    target_user = get_object_or_404(User, id=user_id)
    if target_user.is_superuser:
        messages.error(request, 'Không thể khóa tài khoản Superuser.')
        return redirect('admin_dashboard')

    target_user.is_active = not target_user.is_active
    target_user.save()

    status_str = "MỞ KHÓA" if target_user.is_active else "TẠM KHÓA"
    messages.success(request, f'Tài khoản {target_user.username} đã được {status_str}.')
    return redirect('admin_dashboard')


@login_required
def admin_update_booking_status_view(request, booking_id):
    if not (request.user.is_staff or request.user.role == 'ADMIN'):
        messages.error(request, 'Bạn không có quyền thực hiện thao tác này.')
        return redirect('index')

    booking = get_object_or_404(Booking, id=booking_id)
    new_status = request.POST.get('status')
    if new_status in ['PENDING_PAYMENT', 'PAID', 'CANCELLED']:
        booking.payment_status = new_status
        booking.save()
        messages.success(request, f'Đã cập nhật trạng thái đơn {booking.booking_code} thành {booking.get_payment_status_display()}.')
    
    return redirect('admin_dashboard')



