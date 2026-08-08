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
        Schema::create('bungalow_images', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->foreignId('bungalow_id')->constrained('bungalows')->onDelete('cascade'); // FK tham chiếu bungalows(id)[cite: 1]
    $table->string('image')->nullable();
    $table->json('images')->nullable()->after('image');
    $table->boolean('is_primary')->default(false); // Đánh dấu ảnh đại diện cho bungalow[cite: 1]
    $table->integer('sort_order')->default(0); // Thứ tự hiển thị ảnh[cite: 1]
    
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bungalow_images');
        $table->dropColumn('images');
    }
};
