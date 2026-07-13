<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Move sensitive uploads from the public disk into the private local disk.
     */
    public function up(): void
    {
        $folders = ['payment-proofs', 'seller-verifications', 'messages'];

        foreach ($folders as $folder) {
            $publicRoot = Storage::disk('public')->path($folder);
            if (! is_dir($publicRoot)) {
                continue;
            }

            $files = File::allFiles($publicRoot);
            foreach ($files as $file) {
                $relative = $folder.'/'.ltrim(str_replace('\\', '/', substr($file->getPathname(), strlen($publicRoot))), '/');
                if (Storage::disk('local')->exists($relative)) {
                    continue;
                }
                Storage::disk('local')->put($relative, File::get($file->getPathname()));
            }
        }
    }

    public function down(): void
    {
        // Intentionally leave private copies in place.
    }
};
