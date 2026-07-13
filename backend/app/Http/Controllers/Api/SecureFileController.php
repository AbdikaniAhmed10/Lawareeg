<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Order;
use App\Models\SellerVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SecureFileController extends Controller
{
    public function paymentProof(Request $request, Order $order): StreamedResponse
    {
        $user = $request->user('sanctum') ?? $request->user();

        $partyOk = $user && (
            $user->isAdmin()
            || $user->id === $order->buyer_id
            || $user->id === $order->seller_id
        );

        if (! $partyOk && ! $request->hasValidSignature()) {
            throw new AccessDeniedHttpException('Not allowed to download this file.');
        }

        return $this->streamPrivate($order->payment_proof_path, 'payment-proof');
    }

    public function sellerDocument(Request $request, SellerVerification $verification): StreamedResponse
    {
        $user = $request->user('sanctum') ?? $request->user();

        $partyOk = $user && ($user->isAdmin() || $user->id === $verification->user_id);

        if (! $partyOk && ! $request->hasValidSignature()) {
            throw new AccessDeniedHttpException('Not allowed to download this file.');
        }

        return $this->streamPrivate($verification->document_path, 'seller-document');
    }

    public function messageAttachment(Request $request, Message $message): StreamedResponse
    {
        $user = $request->user('sanctum') ?? $request->user();
        $conversation = $message->conversation;

        $partyOk = $user && $conversation && (
            $user->isAdmin()
            || (int) $user->id === (int) $conversation->buyer_id
            || (int) $user->id === (int) $conversation->seller_id
        );

        if (! $partyOk && ! $request->hasValidSignature()) {
            throw new AccessDeniedHttpException('Not allowed to download this file.');
        }

        return $this->streamPrivate($message->attachment_path, 'attachment');
    }

    private function streamPrivate(?string $path, string $downloadName): StreamedResponse
    {
        if (! $path) {
            throw new NotFoundHttpException('File not found.');
        }

        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->response($path, $downloadName, [
                'Cache-Control' => 'private, no-store',
            ]);
        }

        // Legacy files uploaded to the public disk before hardening.
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->response($path, $downloadName, [
                'Cache-Control' => 'private, no-store',
            ]);
        }

        throw new NotFoundHttpException('File not found.');
    }
}
