<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('q')) {
            $search = $request->string('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        // Admins are seeded only — never change role via API.
        if ($user->isAdmin() || (($data['role'] ?? null) === 'admin')) {
            unset($data['role']);
        }

        $user->update($data);

        return response()->json([
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function suspend(User $user)
    {
        if ($user->isAdmin()) {
            throw ValidationException::withMessages([
                'user' => ['Admin accounts cannot be suspended.'],
            ]);
        }

        $user->update(['is_suspended' => true, 'suspended_at' => now()]);

        return response()->json([
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function reinstate(User $user)
    {
        $user->update(['is_suspended' => false, 'suspended_at' => null]);

        return response()->json([
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->isAdmin()) {
            throw ValidationException::withMessages([
                'user' => ['Admin accounts cannot be deleted. They are managed by the seeder only.'],
            ]);
        }

        if ($request->user()->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}