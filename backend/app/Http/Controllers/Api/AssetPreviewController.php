<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AssetPreviewService;
use Illuminate\Http\Request;

class AssetPreviewController extends Controller
{
    public function __construct(private AssetPreviewService $previewService) {}

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'url' => ['required', 'string', 'max:2048'],
            'category_slug' => ['nullable', 'string', 'max:120'],
        ]);

        $preview = $this->previewService->preview($data['url'], $data['category_slug'] ?? null);

        return response()->json(['data' => $preview]);
    }
}
