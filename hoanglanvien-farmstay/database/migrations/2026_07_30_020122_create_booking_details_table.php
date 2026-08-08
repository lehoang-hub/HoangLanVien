<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('booking_details', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade'); // FK tham chiếu bookings(id)[cite: 1]
    $table->foreignId('bungalow_id')->constrained('bungalows'); // FK tham chiếu bungalows(id)[cite: 1]
    $table->decimal('price_at_booking', 10, 2); // Bắt buộc phải lưu giá tại thời điểm đặt phòng, để tránh sai lệch hóa đơn[cite: 1]
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_details');
    }
};
