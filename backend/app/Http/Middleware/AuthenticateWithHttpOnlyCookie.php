<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWithHttpOnlyCookie
{
    /**
     * Handle an incoming request.
     *
     * Injects Sanctum personal access token from HttpOnly cookie into Authorization header
     * if the client did not explicitly provide a Bearer token in the header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            $token = $request->cookie('bappeda_sanctum_token') ?? $request->cookies->get('bappeda_sanctum_token');
            if (is_string($token) && ! empty($token)) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
