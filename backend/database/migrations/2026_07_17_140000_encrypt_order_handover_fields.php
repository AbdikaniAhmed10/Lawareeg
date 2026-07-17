<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Encrypted payloads are opaque strings — JSON column type is not suitable.
        if (Schema::hasColumn('orders', 'handover_details')) {
            DB::statement('ALTER TABLE orders MODIFY handover_details LONGTEXT NULL');
        }

        if (! Schema::hasColumn('orders', 'handover_purged_at')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->timestamp('handover_purged_at')->nullable()->after('handover_attachment_path');
            });
        }

        // Encrypt any legacy plaintext rows so the encrypted casts can read them.
        $rows = DB::table('orders')
            ->where(function ($q) {
                $q->whereNotNull('handover_notes')->orWhereNotNull('handover_details');
            })
            ->get(['id', 'handover_notes', 'handover_details']);

        foreach ($rows as $row) {
            $notes = $row->handover_notes;
            $details = $row->handover_details;

            if (is_string($notes) && $notes !== '' && ! $this->looksEncrypted($notes)) {
                $notes = Crypt::encryptString($notes);
            }

            if (is_string($details) && $details !== '') {
                if (! $this->looksEncrypted($details)) {
                    $decoded = json_decode($details, true);
                    $payload = is_array($decoded) ? $decoded : ['extra' => $details];
                    $details = Crypt::encryptString(json_encode($payload, JSON_UNESCAPED_UNICODE));
                }
            }

            DB::table('orders')->where('id', $row->id)->update([
                'handover_notes' => $notes,
                'handover_details' => $details,
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orders', 'handover_purged_at')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('handover_purged_at');
            });
        }
    }

    private function looksEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
};
