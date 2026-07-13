<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Model;

class WalletService
{
    public function walletFor(User $user): Wallet
    {
        return Wallet::firstOrCreate(['user_id' => $user->id]);
    }

    public function credit(User $user, float $amount, string $category, ?string $description = null, ?Model $reference = null, array $meta = [], bool $pending = false): WalletTransaction
    {
        $wallet = $this->walletFor($user);

        if ($pending) {
            $wallet->pending_balance += $amount;
        } else {
            $wallet->available_balance += $amount;
        }

        $wallet->total_earnings += $amount;
        $wallet->save();

        return WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'category' => $category,
            'amount' => $amount,
            'balance_after' => $wallet->available_balance,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->getKey(),
            'description' => $description,
            'meta' => $meta,
        ]);
    }

    public function debit(User $user, float $amount, string $category, ?string $description = null, ?Model $reference = null, array $meta = []): WalletTransaction
    {
        $wallet = $this->walletFor($user);
        $wallet->available_balance -= $amount;
        $wallet->save();

        return WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'category' => $category,
            'amount' => $amount,
            'balance_after' => $wallet->available_balance,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->getKey(),
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}
