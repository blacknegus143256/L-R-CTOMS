<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    /**
     * List all services from active shops (for filter sidebar).
     */
    public function index(): JsonResponse
    {
        $services = Service::with('serviceCategory')
        ->whereHas('tailoringShop', function ($q) {
            $q->where('is_active', true);
        })
        ->orderBy('service_category_id')
        ->get(['id', 'tailoring_shop_id', 'service_category_id', 'service_name', 'service_description', 'price', 'duration_days', 'is_available', 'rush_service_available', 'appointment_required', 'notes']);

        return response()->json(['data' => $services]);
    }
}
