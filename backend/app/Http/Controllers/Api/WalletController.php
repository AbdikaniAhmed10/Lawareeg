<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\StoreWithdrawalRequest;
use App\Http\Resources\WalletResource;
use App\Http\Resources\WalletTransactionResource;
use App\Http\Resources\WithdrawalResource;
use App\Models\Withdrawal;
use App\Models\Setting;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WalletController extends Controller
{
    public function __construct(private WalletService $walletService) {}

    public function show(Request $request)
    {
        $wallet = $this->walletService->walletFor($request->user());

        return response()->json([
            'data' => new WalletResource($wallet),
        ]);
    }

    public function transactions(Request $request)
    {
        $wallet = $this->walletService->walletFor($request->user());

        $transactions = $wallet->transactions()->paginate((int) $request->input('per_page', 15));

        return WalletTransactionResource::collection($transactions);
    }

    public function withdrawals(Request $request)
    {
        $withdrawals = $request->user()->withdrawals()
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 15));

        return WithdrawalResource::collection($withdrawals);
    }

    public function storeWithdrawal(StoreWithdrawalRequest $request)
    {
        $user = $request->user();
        $wallet = $this->walletService->walletFor($user);
        $data = $request->validated();

        if ((float) $data['amount'] < Setting::minWithdrawal()) {
            throw ValidationException::withMessages([
                'amount' => ['Minimum withdrawal is $'.number_format(Setting::minWithdrawal(), 2).'.'],
            ]);
        }

        if ((float) $data['amount'] > (float) $wallet->available_balance) {
            throw ValidationException::withMessages(['amount' => ['Insufficient available balance.']]);
        }

        $withdrawal = $user->withdrawals()->create([
            'amount' => $data['amount'],
            'method' => $data['method'],
            'account_details' => is_array($data['account_details']) ? $data['account_details'] : ['details' => $data['account_details']],
            'status' => 'pending',
        ]);

        $this->walletService->debit($user, (float) $data['amount'], 'withdrawal', "Withdrawal request #{$withdrawal->id}", $withdrawal);

        return response()->json([
            'data' => new WithdrawalResource($withdrawal),
        ], 201);
    }

    public function cancelWithdrawal(Request $request, Withdrawal $withdrawal)
    {
        if ($withdrawal->user_id !== $request->user()->id) {
            throw ValidationException::withMessages(['withdrawal' => ['You are not authorized to cancel this withdrawal.']]);
        }

        if ($withdrawal->status !== 'pending') {
            throw ValidationException::withMessages(['withdrawal' => ['Only pending withdrawals can be cancelled.']]);
        }

        $withdrawal->update(['status' => 'cancelled']);

        $this->walletService->credit(
            $withdrawal->user,
            (float) $withdrawal->amount,
            'refund',
            "Withdrawal #{$withdrawal->id} cancelled",
            $withdrawal
        );

        return response()->json([
            'data' => new WithdrawalResource($withdrawal->fresh()),
        ]);
    }
}
