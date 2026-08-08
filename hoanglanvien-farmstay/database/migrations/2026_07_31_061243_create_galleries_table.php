<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable(); // Tiêu đề / Mô tả
            $table->string('file_path')->nullable(); // Đường dẫn file ảnh (nếu là ảnh)
            $table->string('video_url')->nullable(); // Link video (nếu là video YouTube/Mp4)
            $table->enum('type', ['image', 'video']); // Phân loại: ảnh hoặc video
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galleries');
    }
};