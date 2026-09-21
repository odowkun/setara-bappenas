<?php

return [
    'text' => env('DOCUMENT_WATERMARK_TEXT', 'BAPPEDA HALUT'),
    'opacity' => (float) env('DOCUMENT_WATERMARK_OPACITY', 0.06),
    'angle' => (float) env('DOCUMENT_WATERMARK_ANGLE', 35),
    'columns' => (int) env('DOCUMENT_WATERMARK_COLUMNS', 3),
    'rows' => (int) env('DOCUMENT_WATERMARK_ROWS', 4),
    'libreoffice_binary' => env('LIBREOFFICE_BINARY'),
    'conversion_timeout' => (int) env('DOCUMENT_CONVERSION_TIMEOUT', 120),
    'max_file_size_bytes' => (int) env('DOCUMENT_WATERMARK_MAX_BYTES', 150 * 1024 * 1024),
    'supported_extensions' => [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'jpg',
        'jpeg',
        'png',
    ],
];
