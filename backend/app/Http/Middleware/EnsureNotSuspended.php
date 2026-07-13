<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_suspended) {
            // Seeded admins can never stay suspended.
            if ($user->isAdmin()) {
                $user->forceFill(['is_suspended' => false, 'suspended_at' => null])->save();

                return $next($request);
            }

            return response()->json(['message' => 'Your account has been suspended. Please contact support.'], 403);
        }

        return $next($request);
    }
}
