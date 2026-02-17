<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * List all attribute categories with their attributes (for filter sidebar & comparison table).
     */
    public function index(): JsonResponse
    {
        $categories = AttributeCategory::with('attributes:id,attribute_category_id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json(['data' => $categories]);
    }
}
