<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('motorbike_bookings', function (Blueprint $table) {
        $table->id();
        $table->string('booking_code', 50);
        $table->foreignId('customer_id')->nullable(); 
        $table->foreignId('motorbike_id'); 
        $table->date('check_in_date'); // Ngày nhận xe
        $table->date('check_out_date'); // Ngày trả xe
        $table->decimal('total_amount', 12, 2);
        $table->text('notes')->nullable();
        $table->string('status', 50)->default('pending'); // pending, paid, checked_in, checked_out, cancelled
        $table->timestamps();
    });
}
    public function down(): void
    {
        Schema::dropIfExists('motorbike_bookings');
    }
};
