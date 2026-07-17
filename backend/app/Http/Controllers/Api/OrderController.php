<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CancelOrderRequest;
use App\Http\Requests\Order\DisputeRequest;
use App\Http\Requests\Order\MarkTransferringRequest;
use App\Http\Requests\Order\PaymentProofRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\OrderEventResource;
use App\Http\Resources\OrderResource;
use App\Models\Listing;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Order::query()
            ->with(['listing', 'buyer', 'seller', 'conversation'])
            ->where(function ($q) use ($user) {
                $q->where('buyer_id', $user->id)->orWhere('seller_id', $user->id);
            });

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('role') && $request->input('role') === 'buyer') {
            $query->where('buyer_id', $user->id);
        } elseif ($request->filled('role') && $request->input('role') === 'seller') {
            $query->where('seller_id', $user->id);
        }

        $orders = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 10));

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeParty($request, $order);

        return response()->json([
            'data' => new OrderResource($order->load(['listing', 'buyer', 'seller', 'review', 'conversation'])),
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        if ($request->user()->role === 'admin') {
            throw ValidationException::withMessages([
                'listing_id' => ['Admin accounts cannot buy listings. Use a buyer account.'],
            ]);
        }

        $listing = Listing::findOrFail($request->validated('listing_id'));

        try {
            $order = $this->orderService->createOrder(
                $request->user(),
                $listing,
                $request->validated('payment_method')
            );
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['listing_id' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->load(['listing', 'buyer', 'seller'])),
        ], 201);
    }

    public function paymentProof(PaymentProofRequest $request, Order $order)
    {
        if ($order->buyer_id !== $request->user()->id) {
            throw ValidationException::withMessages(['order' => ['Only the buyer can upload payment proof.']]);
        }

        $path = $request->file('file')->store('payment-proofs/'.$order->id, 'local');

        try {
            $order = $this->orderService->submitPaymentProof($order, $request->user(), $path, $request->validated('note'));
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function markTransferring(MarkTransferringRequest $request, Order $order)
    {
        if ($order->seller_id !== $request->user()->id) {
            throw ValidationException::withMessages(['order' => ['Only the seller can mark the asset as transferring.']]);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('handover/'.$order->id, 'local');
        }

        try {
            $order = $this->orderService->markTransferring($order, $request->user(), [
                'notes' => $request->validated('notes'),
                'details' => $request->validated('details') ?? [],
                'attachment_path' => $attachmentPath,
            ]);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller', 'conversation'])),
        ]);
    }

    public function conversation(Request $request, Order $order)
    {
        $this->authorizeParty($request, $order);

        if (! in_array($order->status, [
            Order::STATUS_PAYMENT_CONFIRMED,
            Order::STATUS_SELLER_TRANSFERRING,
            Order::STATUS_BUYER_CONFIRMATION,
            Order::STATUS_COMPLETED,
            Order::STATUS_DISPUTED,
        ], true)) {
            throw ValidationException::withMessages([
                'order' => ['Order chat unlocks after payment is confirmed by admin.'],
            ]);
        }

        $conversation = $this->orderService->ensureOrderConversation($order);

        return response()->json([
            'data' => new ConversationResource($conversation->load(['listing', 'buyer', 'seller', 'order.listing'])),
        ]);
    }

    public function confirmReceipt(Request $request, Order $order)
    {
        if ($order->buyer_id !== $request->user()->id) {
            throw ValidationException::withMessages(['order' => ['Only the buyer can confirm receipt.']]);
        }

        try {
            $order = $this->orderService->confirmReceipt($order, $request->user());
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function cancel(CancelOrderRequest $request, Order $order)
    {
        $this->authorizeParty($request, $order);

        try {
            $order = $this->orderService->cancelOrder($order, $request->user(), $request->validated('reason'));
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function dispute(DisputeRequest $request, Order $order)
    {
        $this->authorizeParty($request, $order);

        try {
            $order = $this->orderService->openDispute(
                $order,
                $request->user(),
                $request->validated('reason'),
                $request->validated('evidence')
            );
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function timeline(Request $request, Order $order)
    {
        $this->authorizeParty($request, $order);

        $events = $order->events()->with('actor')->get();

        return OrderEventResource::collection($events);
    }

    private function authorizeParty(Request $request, Order $order): void
    {
        $user = $request->user();

        if ($order->buyer_id !== $user->id && $order->seller_id !== $user->id && $user->role !== 'admin') {
            throw ValidationException::withMessages(['order' => ['You are not authorized to view this order.']]);
        }
    }
}
