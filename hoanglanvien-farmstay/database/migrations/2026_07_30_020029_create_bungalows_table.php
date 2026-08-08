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
        Schema::create('bungalows', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->string('name'); // Tên/Mã bungalow[cite: 1]
    $table->string('slug')->unique(); // Dùng cho URL SEO[cite: 1]
    $table->text('description')->nullable(); // TEXT[cite: 1]
    $table->integer('capacity'); // Sức chứa tiêu chuẩn[cite: 1]
    $table->integer('max_capacity'); // Sức chứa tối đa, có thể phụ thu[cite: 1]
    $table->decimal('base_price', 10, 2); // Giá gốc niêm yết[cite: 1]
    $table->enum('status', ['available', 'maintenance', 'inactive'])->default('available'); // Trạng thái vật lý của phòng[cite: 1]
    $table->timestamps(); // created_at, updated_at[cite: 1]
    $table->date('available_from')->nullable(); 
    $table->date('available_to')->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bungalows');
    }
};
