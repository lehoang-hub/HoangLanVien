# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class BookingDetails(models.Model):
    id = models.BigAutoField(primary_key=True)
    booking = models.ForeignKey('Bookings', models.CASCADE)
    bungalow_id = models.PositiveBigIntegerField()
    price_at_booking = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'booking_details'


class Bookings(models.Model):
    id = models.BigAutoField(primary_key=True)
    booking_code = models.CharField(max_length=50)
    customer = models.ForeignKey('Customers', models.CASCADE)
    bungalow_id = models.PositiveBigIntegerField(blank=True, null=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    total_guests = models.IntegerField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bookings'


class BungalowImages(models.Model):
    id = models.BigAutoField(primary_key=True)
    bungalow = models.ForeignKey('Bungalows', models.CASCADE)
    image = models.CharField(max_length=191, blank=True, null=True)
    is_primary = models.IntegerField()
    sort_order = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'bungalow_images'


class Bungalows(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=191)
    image = models.CharField(max_length=255, blank=True, null=True)
    images = models.JSONField(blank=True, null=True)
    slug = models.CharField(unique=True, max_length=191)
    description = models.TextField(blank=True, null=True)
    capacity = models.IntegerField()
    max_capacity = models.IntegerField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=255)
    daily_status = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    available_from = models.DateField(blank=True, null=True)
    available_to = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bungalows'


class Cache(models.Model):
    key = models.CharField(primary_key=True, max_length=191)
    value = models.TextField()
    expiration = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'cache'



class CacheLocks(models.Model):
    key = models.CharField(primary_key=True, max_length=191)
    owner = models.CharField(max_length=191)
    expiration = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'cache_locks'


class Customers(models.Model):
    id = models.BigAutoField(primary_key=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(unique=True, max_length=20)
    email = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'customers'


class FailedJobs(models.Model):
    id = models.BigAutoField(primary_key=True)
    uuid = models.CharField(unique=True, max_length=191)
    connection = models.CharField(max_length=191)
    queue = models.CharField(max_length=191)
    payload = models.TextField()
    exception = models.TextField()
    failed_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'failed_jobs'


class Galleries(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=191, blank=True, null=True)
    file_path = models.CharField(max_length=191, blank=True, null=True)
    video_url = models.CharField(max_length=191, blank=True, null=True)
    type = models.CharField(max_length=5)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'galleries'


class JobBatches(models.Model):
    id = models.CharField(primary_key=True, max_length=191)
    name = models.CharField(max_length=191)
    total_jobs = models.IntegerField()
    pending_jobs = models.IntegerField()
    failed_jobs = models.IntegerField()
    failed_job_ids = models.TextField()
    options = models.TextField(blank=True, null=True)
    cancelled_at = models.IntegerField(blank=True, null=True)
    created_at = models.IntegerField()
    finished_at = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'job_batches'


class Jobs(models.Model):
    id = models.BigAutoField(primary_key=True)
    queue = models.CharField(max_length=191)
    payload = models.TextField()
    attempts = models.PositiveSmallIntegerField()
    reserved_at = models.PositiveIntegerField(blank=True, null=True)
    available_at = models.PositiveIntegerField()
    created_at = models.PositiveIntegerField()

    class Meta:
        managed = False
        db_table = 'jobs'


class MenuItems(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=191)
    slug = models.CharField(unique=True, max_length=191)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.CharField(max_length=191, blank=True, null=True)
    type = models.CharField(max_length=5)
    category = models.CharField(max_length=191, blank=True, null=True)
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'menu_items'


class Migrations(models.Model):
    migration = models.CharField(max_length=191)
    batch = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'migrations'


class MotorbikeBookings(models.Model):
    id = models.BigAutoField(primary_key=True)
    booking_code = models.CharField(max_length=50)
    customer_id = models.PositiveBigIntegerField(blank=True, null=True)
    motorbike_id = models.PositiveBigIntegerField()
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'motorbike_bookings'


class Motorbikes(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=191)
    license_plate = models.CharField(max_length=191, blank=True, null=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    images = models.JSONField(blank=True, null=True)
    daily_status = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'motorbikes'


class PasswordResetTokens(models.Model):
    email = models.CharField(primary_key=True, max_length=191)
    token = models.CharField(max_length=191)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'password_reset_tokens'


class PersonalAccessTokens(models.Model):
    id = models.BigAutoField(primary_key=True)
    tokenable_type = models.CharField(max_length=191)
    tokenable_id = models.PositiveBigIntegerField()
    name = models.TextField()
    token = models.CharField(unique=True, max_length=64)
    abilities = models.TextField(blank=True, null=True)
    last_used_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'personal_access_tokens'


class Sessions(models.Model):
    id = models.CharField(primary_key=True, max_length=191)
    user_id = models.PositiveBigIntegerField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    payload = models.TextField()
    last_activity = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'sessions'


class Settings(models.Model):
    key = models.CharField(unique=True, max_length=100)
    value = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'settings'


class Users(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=191)
    email = models.CharField(unique=True, max_length=191)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    password = models.CharField(max_length=191)
    role = models.CharField(max_length=12)
    remember_token = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
