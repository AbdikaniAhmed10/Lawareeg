<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
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
        $query = Order::query()->with(['listing', 'buyer', 'seller']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $orders = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return OrderResource::collection($orders);
    }

    public function show(Order $order)
    {
        return response()->json([
            'data' => new OrderResource($order->load(['listing', 'buyer', 'seller', 'events.actor', 'review'])),
        ]);
    }

    public function confirmPayment(Request $request, Order $order)
    {
        try {
            $order = $this->orderService->confirmPayment($order, $request->user());
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function releaseFunds(Request $request, Order $order)
    {
        try {
            $order = $this->orderService->completeOrder($order, $request->user());
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function refund(Request $request, Order $order)
    {
        try {
            $order = $this->orderService->refund($order, $request->user());
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function resolveDispute(Request $request, Order $order)
    {
        $data = $request->validate([
            'resolution' => ['required', 'string', 'max:2000'],
            'outcome' => ['required', 'in:completed,refunded,cancelled'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $order = $this->orderService->resolveDispute(
                $order,
                $request->user(),
                $data['resolution'],
                $data['outcome'],
                $data['note'] ?? null
            );
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['order' => [$e->getMessage()]]);
        }

        return response()->json([
            'data' => new OrderResource($order->fresh(['listing', 'buyer', 'seller'])),
        ]);
    }
}
