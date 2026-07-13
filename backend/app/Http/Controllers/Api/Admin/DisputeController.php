<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;

class DisputeController extends Controller
{
    public function index(Request $request)
    {
        $disputes = Order::query()
            ->with(['listing', 'buyer', 'seller'])
            ->where('status', Order::STATUS_DISPUTED)
            ->orderByDesc('dispute_opened_at')
            ->paginate((int) $request->input('per_page', 20));

        return OrderResource::collection($disputes);
    }
}
