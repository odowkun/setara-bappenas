<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminMutation
{
    /**
     * Record successful authenticated mutations without trusting actor fields
     * supplied by the client or persisting request bodies that may contain PII.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $actor = $request->user();
        $response = $next($request);

        if (
            $actor
            && ! $request->isMethodSafe()
            && $response->getStatusCode() < 400
        ) {
            $routeName = $request->route()?->getName();
            $action = $routeName
                ? Str::upper(str_replace(['.', '-'], '_', $routeName))
                : 'ADMIN_MUTATION';

            try {
                DB::table('audit_logs')->insert([
                    'user_name' => $actor->name,
                    'user_role' => $actor->getRoleNames()->first() ?? $actor->role,
                    'action' => $action,
                    'details' => sprintf(
                        '%s %s selesai dengan status %d',
                        $request->method(),
                        $request->path(),
                        $response->getStatusCode()
                    ),
                    'ip_address' => $request->ip() ?? 'unknown',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $exception) {
                Log::error('Gagal menyimpan audit mutation admin.', [
                    'route' => $routeName,
                    'actor_id' => $actor->getKey(),
                    'exception' => $exception,
                ]);
            }
        }

        return $response;
    }
}
