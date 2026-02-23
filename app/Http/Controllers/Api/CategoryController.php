<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * List all attribute categories with their attributes and all unique services (for filter sidebar & comparison table).
     */
    public function index(): JsonResponse
    {
        $categories = AttributeCategory::with('attributes:id,attribute_category_id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        // Get all unique services from all active shops
        $services = \App\Models\Service::whereHas('tailoringShop', function ($q) {
            $q->where('is_active', true);
        })
            ->distinct()
            ->orderBy('service_category')
            ->get(['id', 'service_category', 'starting_price', 'turnaround_time']);

        return response()->json([
            'data' => $categories,
            'services' => $services
        ]);
    }
}
