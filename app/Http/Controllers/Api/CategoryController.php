<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeCategory;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * List all attribute categories with their attributes and all unique services (for filter sidebar & comparison table).
     */
    public function index(): JsonResponse
    {
        $categories = AttributeCategory::with('attributeTypes:id,attribute_category_id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        // Get all service categories
        $serviceCategories = ServiceCategory::orderBy('name')->get(['id', 'name', 'slug']);

        // Get all services from active shops
        $services = \App\Models\Service::whereHas('tailoringShop', function ($q) {
            $q->where('is_active', true);
        })
            ->with('serviceCategory')
            ->distinct()
            ->orderBy('service_category_id')
            ->get(['id','tailoring_shop_id', 'service_category_id', 'service_name', 'price', 'duration_days', 'is_available', 'rush_service_available', 'appointment_required', 'notes']);

        return response()->json([
            'data' => $categories,
            'services' => $services,
            'service_categories' => $serviceCategories,
        ]);
    }
}
