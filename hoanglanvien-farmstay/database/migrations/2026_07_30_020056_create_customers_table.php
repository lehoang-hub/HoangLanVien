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
        Schema::create('customers', function (Blueprint $table) {
    $table->id(); // BIGINT, PK, Auto Increment[cite: 1]
    $table->string('full_name'); // VARCHAR(255)[cite: 1]
    $table->string('phone', 20); // VARCHAR(20)[cite: 1]
    $table->string('email')->nullable(); // VARCHAR(255), Nullable[cite: 1]
    $table->timestamps(); // created_at, updated_at[cite: 1]
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
