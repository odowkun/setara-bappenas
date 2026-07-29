<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyek_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyek_detail_id')->constrained('proyek_details')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->default('foto'); // foto, ded, amdal, pdf, doc
            $table->unsignedBigInteger('esri_attachment_id')->nullable();
            $table->string('file_size')->default('0 MB');
            $table->string('uploaded_by')->default('Admin');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proyek_attachments');
    }
};
