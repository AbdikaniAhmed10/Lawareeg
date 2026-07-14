<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();
        $email = Str::lower(trim($data['email']));

        $user = User::create([
            'name' => $data['name'],
            'email' => $email,
            // Plain value — User model `hashed` cast hashes once.
            'password' => $data['password'],
            'country' => $data['country'],
            'role' => $data['role'] ?? 'buyer',
            'referral_code' => Str::upper(Str::random(8)),
        ]);

        $user->wallet()->create([]);
        $user->refresh();

        $mailSent = $this->sendVerificationSafely($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'message' => $mailSent
                ? 'Account created. Enter the 6-digit code we emailed you to verify your account.'
                : 'Account created, but we could not send the verification email. Tap Resend code in a moment.',
            'email_verified' => false,
            'mail_sent' => $mailSent,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $data = $request->validated();
        $email = Str::lower(trim($data['email']));

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Incorrect email or password.'],
            ]);
        }

        if ($user->isAdmin() && $user->is_suspended) {
            $user->forceFill(['is_suspended' => false, 'suspended_at' => null])->save();
            $user->refresh();
        }

        if ($user->is_suspended) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        if ($user->isAdmin() && ! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
            $user->refresh();
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'email_verified' => $user->hasVerifiedEmail(),
            'message' => $user->hasVerifiedEmail()
                ? null
                : 'Please enter the verification code from your email before accessing the dashboard.',
        ]);
    }

    public function verifyEmailCode(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'user' => new UserResource($user),
                'message' => 'Email already verified.',
                'email_verified' => true,
            ]);
        }

        if (
            ! $user->email_verification_code
            || ! $user->email_verification_expires_at
            || $user->email_verification_expires_at->isPast()
        ) {
            throw ValidationException::withMessages([
                'code' => ['This code has expired. Request a new one.'],
            ]);
        }

        if (! Hash::check($data['code'], $user->email_verification_code)) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->markEmailAsVerified();
        $user->clearEmailVerificationCode();
        event(new Verified($user));

        return response()->json([
            'user' => new UserResource($user->fresh()),
            'message' => 'Email verified successfully.',
            'email_verified' => true,
        ]);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if (! $this->sendVerificationSafely($user)) {
            return response()->json([
                'message' => 'Could not send the verification email. Check mail settings or try again shortly.',
            ], 503);
        }

        return response()->json(['message' => 'A new verification code was sent. Check your inbox (and spam).']);
    }

    private function sendVerificationSafely(User $user): bool
    {
        try {
            $user->sendEmailVerificationNotification();

            return true;
        } catch (Throwable $e) {
            Log::error('Failed to send verification email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $status = Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => $status === Password::RESET_LINK_SENT
                ? 'A password reset link has been sent to your email.'
                : 'Unable to send reset link for this email address.',
        ], $status === Password::RESET_LINK_SENT ? 200 : 422);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Your password has been reset successfully.']);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($data);

        return response()->json([
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();

        if (! Hash::check($request->validated('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->validated('password')]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
