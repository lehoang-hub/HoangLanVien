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
        Schema::create('payments', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade'); // FK tham chiếu bookings(id)[cite: 1]
    $table->decimal('amount', 12, 2); // Số tiền thanh toán thực tế[cite: 1]
    $table->enum('payment_method', ['bank_transfer', 'momo', 'vnpay', 'cash']); // Phương thức thanh toán[cite: 1]
    $table->enum('payment_status', ['pending', 'success', 'failed', 'refunded'])->default('pending'); // Trạng thái thanh toán[cite: 1]
    $table->string('transaction_id')->nullable(); // Mã giao dịch từ cổng thanh toán/ngân hàng trả về[cite: 1]
    $table->timestamp('paid_at')->nullable(); // TIMESTAMP, Nullable[cite: 1]
    $table->timestamps(); // created_at, updated_at[cite: 1]
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
