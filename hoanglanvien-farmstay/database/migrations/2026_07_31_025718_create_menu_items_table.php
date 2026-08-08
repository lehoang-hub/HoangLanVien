<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Tên món (Food/Drink)
            $table->string('slug')->unique(); // URL thân thiện
            $table->text('description')->nullable(); // Mô tả món ăn (desc)
            $table->decimal('price', 10, 2); // Giá bán
            $table->string('image')->nullable(); // Link ảnh
            
            // Cột nhận diện: 'food' hoặc 'drink'
            $table->enum('type', ['food', 'drink']); 
            
            // Phân loại chi tiết (VD: 'Món chính', 'Nước hoa quả'...)
            $table->string('category')->nullable(); 

            // Trạng thái: còn hàng hay hết hàng
            $table->enum('status', ['available', 'out_of_stock'])->default('available'); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};