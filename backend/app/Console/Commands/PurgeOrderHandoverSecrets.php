<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Console\Command;

class PurgeOrderHandoverSecrets extends Command
{
    protected $signature = 'orders:purge-handover
                            {--days=0 : Only purge completed/cancelled orders older than this many days (0 = immediately eligible)}';

    protected $description = 'Permanently delete encrypted transfer secrets from finished orders';

    public function handle(OrderService $orders): int
    {
        $days = max(0, (int) $this->option('days'));

        $query = Order::query()
            ->whereIn('status', [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED])
            ->where(function ($q) {
                $q->whereNotNull('handover_notes')
                    ->orWhereNotNull('handover_details')
                    ->orWhereNotNull('handover_attachment_path');
            });

        if ($days > 0) {
            $query->where(function ($q) use ($days) {
                $q->where('completed_at', '<=', now()->subDays($days))
                    ->orWhere('cancelled_at', '<=', now()->subDays($days));
            });
        }

        $count = 0;
        $query->orderBy('id')->chunkById(50, function ($chunk) use ($orders, &$count) {
            foreach ($chunk as $order) {
                $orders->purgeSensitiveHandover($order);
                $count++;
            }
        });

        $this->info("Purged handover secrets from {$count} order(s).");

        return self::SUCCESS;
    }
}
