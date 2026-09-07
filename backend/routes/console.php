<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('documents:archive-retention-scan')
    ->dailyAt('01:30')
    ->withoutOverlapping();

Schedule::command('documents:archive-extract')
    ->dailyAt('02:00')
    ->withoutOverlapping();
