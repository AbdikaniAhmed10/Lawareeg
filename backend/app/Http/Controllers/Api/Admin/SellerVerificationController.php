<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SellerVerificationResource;
use App\Models\SellerVerification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SellerVerificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        $query = SellerVerification::query()
            ->with(['user'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return SellerVerificationResource::collection(
            $query->paginate((int) $request->input('per_page', 20))
        );
    }

    public function approve(Request $request, SellerVerification $verification)
    {
        if ($verification->status !== 'pending') {
            throw ValidationException::withMessages([
                'verification' => ['Only pending requests can be approved.'],
            ]);
        }

        $verification->update([
            'status' => 'approved',
            'notes' => $request->input('notes'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $user = $verification->user;
        $user->update([
            'is_verified_seller' => true,
            'seller_verification_status' => 'approved',
            'seller_verification_notes' => $request->input('notes'),
        ]);

        $this->notifications->send(
            $user,
            'seller_verification_approved',
            'Verification approved',
            'Your seller verification badge has been approved. Buyers will now see your verified badge.',
            ['verification_id' => $verification->id]
        );

        return response()->json([
            'data' => new SellerVerificationResource($verification->fresh()->load('user')),
            'message' => 'Seller verification approved.',
        ]);
    }

    public function reject(Request $request, SellerVerification $verification)
    {
        if ($verification->status !== 'pending') {
            throw ValidationException::withMessages([
                'verification' => ['Only pending requests can be rejected.'],
            ]);
        }

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $notes = $data['notes'] ?? $data['reason'] ?? 'Document could not be verified. Please resubmit clearer ID photos.';

        $verification->update([
            'status' => 'rejected',
            'notes' => $notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $user = $verification->user;
        $user->update([
            'is_verified_seller' => false,
            'seller_verification_status' => 'rejected',
            'seller_verification_notes' => $notes,
        ]);

        $this->notifications->send(
            $user,
            'seller_verification_rejected',
            'Verification rejected',
            $notes,
            ['verification_id' => $verification->id]
        );

        return response()->json([
            'data' => new SellerVerificationResource($verification->fresh()->load('user')),
            'message' => 'Seller verification rejected.',
        ]);
    }
}
