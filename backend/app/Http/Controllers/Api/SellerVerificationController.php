<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SellerVerification\StoreSellerVerificationRequest;
use App\Http\Resources\SellerVerificationResource;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SellerVerificationController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $verification = $user->latestSellerVerification;

        return response()->json([
            'data' => $verification ? new SellerVerificationResource($verification) : null,
            'seller_verification_status' => $user->seller_verification_status,
            'is_verified_seller' => (bool) $user->is_verified_seller,
        ]);
    }

    public function store(StoreSellerVerificationRequest $request)
    {
        $user = $request->user();

        if ($user->is_verified_seller || $user->seller_verification_status === 'approved') {
            throw ValidationException::withMessages([
                'document' => ['Your account is already verified.'],
            ]);
        }

        if ($user->seller_verification_status === 'pending') {
            throw ValidationException::withMessages([
                'document' => ['Your verification request is already under review.'],
            ]);
        }

        $path = $request->file('document')->store('seller-verifications/'.$user->id, 'local');

        $verification = $user->sellerVerifications()->create([
            'document_path' => $path,
            'id_type' => $request->validated('id_type'),
            'status' => 'pending',
        ]);

        $user->update(['seller_verification_status' => 'pending']);

        return response()->json([
            'data' => new SellerVerificationResource($verification),
            'seller_verification_status' => 'pending',
            'message' => 'Verification request submitted. An admin will review it soon.',
        ], 201);
    }
}
