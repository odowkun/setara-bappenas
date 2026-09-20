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

if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri) && !is_dir(__DIR__.'/public'.$uri)) {
    return false;
}

// Layani file publik /storage/* secara langsung dari storage/app/public tanpa ketergantungan symlink Windows
if (str_starts_with($uri, '/storage/')) {
    $storageRelative = substr($uri, 9);
    $storageFile = __DIR__.'/storage/app/public/'.$storageRelative;
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

require_once __DIR__.'/public/index.php';
