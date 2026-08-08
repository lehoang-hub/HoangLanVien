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
       Schema::create('bookings', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->string('booking_code', 50)->unique(); // Mã tra cứu[cite: 1]
    $table->foreignId('customer_id')->constrained('customers'); // FK tham chiếu customers(id)[cite: 1]
    $table->date('check_in_date'); // DATE[cite: 1]
    $table->date('check_out_date'); // DATE[cite: 1]
    $table->integer('total_guests'); // INT[cite: 1]
    $table->decimal('total_amount', 12, 2); // Tổng tiền của cả đơn[cite: 1]
    $table->text('notes')->nullable(); // Ghi chú của khách hoặc admin[cite: 1]
    $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending'); // Trạng thái đơn[cite: 1]
    $table->timestamps(); // created_at, updated_at[cite: 1]
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
