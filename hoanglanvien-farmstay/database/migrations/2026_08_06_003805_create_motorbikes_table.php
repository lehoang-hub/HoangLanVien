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
    Schema::create('motorbikes', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // Tên xe (VD: Honda Air Blade)
        $table->string('license_plate')->nullable(); // Biển số xe
        $table->decimal('base_price', 12, 2); // Giá thuê/ngày
        $table->text('description')->nullable();
        $table->json('images')->nullable();
        $table->json('daily_status')->nullable(); // Quản lý lịch bận/trống giống Bungalow
        $table->timestamps();
    });
}
    public function down(): void
    {
        Schema::dropIfExists('motorbikes');
    }
};
