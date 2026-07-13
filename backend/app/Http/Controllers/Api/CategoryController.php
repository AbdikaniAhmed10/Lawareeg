<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ListingResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->withCount(['listings' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->orderBy('sort_order')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function listings(Request $request, string $slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $listings = $category->listings()
            ->with(['category', 'user'])
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 12));

        return ListingResource::collection($listings);
    }
}
