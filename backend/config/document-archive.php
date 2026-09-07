<?php

return [
    'disk' => env('DOCUMENT_ARCHIVE_DISK', 'local'),
    'code_prefix' => env('DOCUMENT_ARCHIVE_CODE_PREFIX', 'BPH-DOC'),
    'preview_ttl_minutes' => (int) env('DOCUMENT_PREVIEW_TTL_MINUTES', 5),
    'download_ttl_minutes' => (int) env('DOCUMENT_DOWNLOAD_TTL_MINUTES', 5),
    'extraction_timeout_seconds' => (int) env('DOCUMENT_EXTRACTION_TIMEOUT', 120),
    'ocr_page_timeout_seconds' => (int) env('DOCUMENT_OCR_PAGE_TIMEOUT', 60),
    'pdftotext_binary' => env('PDFTOTEXT_BINARY'),
    'pdfinfo_binary' => env('PDFINFO_BINARY'),
    'pdftoppm_binary' => env('PDFTOPPM_BINARY'),
    'tesseract_binary' => env('TESSERACT_BINARY'),
    'ocr_enabled' => filter_var(
        env('DOCUMENT_OCR_ENABLED', false),
        FILTER_VALIDATE_BOOL
    ),
    'ocr_language' => env('DOCUMENT_OCR_LANGUAGE', 'ind+eng'),
    'ocr_resolution' => (int) env('DOCUMENT_OCR_RESOLUTION', 200),
    'ocr_max_pages' => (int) env('DOCUMENT_OCR_MAX_PAGES', 100),
    'retention_scan_limit' => (int) env('DOCUMENT_RETENTION_SCAN_LIMIT', 500),
];
