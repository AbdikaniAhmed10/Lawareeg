<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WithdrawalResource;
use App\Models\Withdrawal;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WithdrawalController extends Controller
{
    public function __construct(private WalletService $walletService) {}

    public function index(Request $request)
    {
        $query = Withdrawal::query()->with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $withdrawals = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return WithdrawalResource::collection($withdrawals);
    }

    public function approve(Request $request, Withdrawal $withdrawal)
    {
        $this->assertStatus($withdrawal, ['pending']);

        $withdrawal->update([
            'status' => 'approved',
            'processed_at' => now(),
            'processed_by' => $request->user()->id,
        ]);

        return response()->json(['data' => new WithdrawalResource($withdrawal->fresh())]);
    }

    public function reject(Request $request, Withdrawal $withdrawal)
    {
        $this->assertStatus($withdrawal, ['pending', 'approved']);

        $request->validate(['admin_note' => ['nullable', 'string', 'max:2000']]);

        $withdrawal->update([
            'status' => 'rejected',
            'admin_note' => $request->input('admin_note'),
            'processed_at' => now(),
            'processed_by' => $request->user()->id,
        ]);

        $this->walletService->credit(
            $withdrawal->user,
            (float) $withdrawal->amount,
            'refund',
            "Withdrawal #{$withdrawal->id} rejected and refunded",
            $withdrawal
        );

        return response()->json(['data' => new WithdrawalResource($withdrawal->fresh())]);
    }

    public function markPaid(Request $request, Withdrawal $withdrawal)
    {
        $this->assertStatus($withdrawal, ['pending', 'approved']);

        $withdrawal->update([
            'status' => 'paid',
            'processed_at' => now(),
            'processed_by' => $request->user()->id,
        ]);

        return response()->json(['data' => new WithdrawalResource($withdrawal->fresh())]);
    }

    private function assertStatus(Withdrawal $withdrawal, array $allowed): void
    {
        if (! in_array($withdrawal->status, $allowed, true)) {
            throw ValidationException::withMessages(['withdrawal' => ["This withdrawal cannot be updated from status \"{$withdrawal->status}\"."]]);
        }
    }
}
