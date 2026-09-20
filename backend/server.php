<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * This file allows us to emulate Apache's "mod_rewrite" functionality from the
 * built-in PHP web server without invoking interactive cmd.exe subshells on Windows.
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// 1. Layani file publik /storage/* secara langsung dari storage/app/public ATAU public/storage
if (str_starts_with($uri, '/storage/')) {
    $storageRelative = substr($uri, 9);
    $candidates = [
        __DIR__.'/storage/app/public/'.$storageRelative,
        __DIR__.'/public/storage/'.$storageRelative,
        __DIR__.'/public'.$uri,
    ];

    foreach ($candidates as $storageFile) {
        if (file_exists($storageFile) && !is_dir($storageFile)) {
            $ext = strtolower(pathinfo($storageFile, PATHINFO_EXTENSION));
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
            $mime = $mimes[$ext] ?? (function_exists('mime_content_type') ? (mime_content_type($storageFile) ?: 'application/octet-stream') : 'application/octet-stream');

            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
            header('Content-Type: '.$mime);
            header('Content-Length: '.filesize($storageFile));
            header('Cache-Control: public, max-age=31536000');
            readfile($storageFile);
            exit;
        }
    }
}

// 2. Layani aset statis non-storage yang ada di public/ (css, js, images, dll)
$publicStatic = __DIR__.'/public'.$uri;
if ($uri !== '/' && file_exists($publicStatic) && !is_dir($publicStatic)) {
    $ext = strtolower(pathinfo($publicStatic, PATHINFO_EXTENSION));
    $mimes = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
    ];
    if (isset($mimes[$ext])) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: '.$mimes[$ext]);
        header('Content-Length: '.filesize($publicStatic));
        readfile($publicStatic);
        exit;
    }
    return false;
}

require_once __DIR__.'/public/index.php';
