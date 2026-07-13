<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Listing;
use App\Models\Order;
use App\Models\User;
use App\Models\Withdrawal;

class DashboardController extends Controller
{
    public function index()
    {
        $totalRevenue = (float) Order::where('status', Order::STATUS_COMPLETED)->sum('commission_amount');
        $totalSalesVolume = (float) Order::where('status', Order::STATUS_COMPLETED)->sum('price');

        $recentOrders = Order::query()
            ->with(['listing:id,title'])
            ->latest()
            ->limit(8)
            ->get();

        return response()->json([
            'data' => [
                'users' => [
                    'total' => User::count(),
                    'buyers' => User::where('role', 'buyer')->count(),
                    'sellers' => User::where('role', 'seller')->count(),
                    'suspended' => User::where('is_suspended', true)->count(),
                ],
                'listings' => [
                    'total' => Listing::count(),
                    'pending' => Listing::where('status', 'pending')->count(),
                    'approved' => Listing::where('status', 'approved')->count(),
                    'sold' => Listing::where('status', 'sold')->count(),
                ],
                'orders' => [
                    'total' => Order::count(),
                    'pending_payment' => Order::where('status', Order::STATUS_PENDING_PAYMENT)->count(),
                    'payment_under_review' => Order::where('status', Order::STATUS_PAYMENT_UNDER_REVIEW)->count(),
                    'in_progress' => Order::whereIn('status', [
                        Order::STATUS_PAYMENT_CONFIRMED,
                        Order::STATUS_SELLER_TRANSFERRING,
                        Order::STATUS_BUYER_CONFIRMATION,
                    ])->count(),
                    'completed' => Order::where('status', Order::STATUS_COMPLETED)->count(),
                    'disputed' => Order::where('status', Order::STATUS_DISPUTED)->count(),
                    'cancelled' => Order::where('status', Order::STATUS_CANCELLED)->count(),
                ],
                'withdrawals' => [
                    'pending' => Withdrawal::where('status', 'pending')->count(),
                    'pending_amount' => (float) Withdrawal::where('status', 'pending')->sum('amount'),
                ],
                'revenue' => [
                    'total_commission' => $totalRevenue,
                    'total_sales_volume' => $totalSalesVolume,
                ],
                'recent_orders' => OrderResource::collection($recentOrders)->resolve(),
            ],
        ]);
    }
}
