<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $months = (int) $request->input('months', 6);
        $from = now()->subMonths($months)->startOfMonth();

        $salesByMonth = Order::query()
            ->where('status', Order::STATUS_COMPLETED)
            ->where('completed_at', '>=', $from)
            ->selectRaw("strftime('%Y-%m', completed_at) as month, COUNT(*) as orders_count, SUM(price) as sales_volume, SUM(commission_amount) as commission")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $topCategories = DB::table('orders')
            ->join('listings', 'listings.id', '=', 'orders.listing_id')
            ->join('categories', 'categories.id', '=', 'listings.category_id')
            ->where('orders.status', Order::STATUS_COMPLETED)
            ->selectRaw('categories.name as category, COUNT(*) as orders_count, SUM(orders.price) as sales_volume')
            ->groupBy('categories.name')
            ->orderByDesc('sales_volume')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'sales_by_month' => $salesByMonth,
                'top_categories' => $topCategories,
                'totals' => [
                    'completed_orders' => Order::where('status', Order::STATUS_COMPLETED)->count(),
                    'total_sales_volume' => (float) Order::where('status', Order::STATUS_COMPLETED)->sum('price'),
                    'total_commission' => (float) Order::where('status', Order::STATUS_COMPLETED)->sum('commission_amount'),
                ],
            ],
        ]);
    }
}
