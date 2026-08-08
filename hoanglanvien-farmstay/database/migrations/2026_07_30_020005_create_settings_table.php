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
        Schema::create('settings', function (Blueprint $table) {
    $table->integer('id')->autoIncrement(); // INT, PK, Auto Increment[cite: 1]
    $table->string('key', 100)->unique(); // VARCHAR(100), Unique[cite: 1]
    $table->longText('value')->nullable(); // Nội dung tương ứng, có thể lưu chuỗi JSON[cite: 1]
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
