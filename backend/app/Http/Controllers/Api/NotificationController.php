<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()
            ->paginate((int) $request->input('per_page', 20));

        return NotificationResource::collection($notifications);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            throw ValidationException::withMessages(['notification' => ['You are not authorized to update this notification.']]);
        }

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json([
            'data' => new NotificationResource($notification->fresh()),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
