<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->unsignedBigInteger('service_id')->nullable()->after('id');
            $table->string('question_type')->default('rating')->after('description');
            $table->text('options')->nullable()->after('question_type');

            $table->foreign('service_id')->references('id')->on('survey_services')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn(['service_id', 'question_type', 'options']);
        });
    }
};
