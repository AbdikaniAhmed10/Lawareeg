<?php

use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureNotSuspended;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Bearer-token API auth (Sanctum createToken) — do NOT enable statefulApi(),
        // or login/register from the Vite SPA will fail with "CSRF token mismatch".

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'not-suspended' => EnsureNotSuspended::class,
            'verified' => EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
