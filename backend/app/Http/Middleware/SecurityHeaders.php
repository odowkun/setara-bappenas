<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        if (
            ! $request->routeIs('documents.file.preview')
            && ! $request->routeIs('documents.file.admin-preview')
        ) {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        }
        $response->headers->set('Referrer-Policy', 'same-origin');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(self)'
        );

        if (
            $request->is('api/v1/auth/*')
            || $request->is('api/v1/admin/*')
            || $request->is('api/v1/users*')
            || $request->is('api/v1/audit-logs*')
            || $request->is('api/v1/document-download-logs*')
            || $request->is('api/v1/surveys')
            || $request->is('api/v1/kritik')
        ) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        if ($request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
