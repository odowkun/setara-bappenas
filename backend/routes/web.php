<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback penyaji berkas /storage/* untuk server produksi Windows
Route::get('/storage/{path}', function (string $path) {
    $candidates = [
        storage_path('app/public/'.$path),
        storage_path('app/private/'.$path),
        storage_path('app/'.$path),
        public_path('storage/'.$path),
        public_path($path),
    ];

    $filePath = null;
    foreach ($candidates as $cand) {
        if (file_exists($cand) && !is_dir($cand)) {
            $filePath = $cand;
            break;
        }
    }

    if (! $filePath) {
        abort(404);
    }

    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimes = [
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'ico'  => 'image/x-icon',
        'pdf'  => 'application/pdf',
        'json' => 'application/json',
    ];
    $mimeType = $mimes[$ext] ?? (function_exists('mime_content_type') ? (mime_content_type($filePath) ?: 'application/octet-stream') : 'application/octet-stream');

    return response()->file($filePath, [
        'Access-Control-Allow-Origin' => '*',
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('path', '.*');

