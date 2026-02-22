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
        $services = Service::whereHas('tailoringShop', function ($q) {
            $q->where('is_active', true);
        })
        ->orderBy('service_name')
        ->get(['id', 'tailoring_shop_id', 'service_name', 'price', 'duration_days']);

        return response()->json(['data' => $services]);
    }
}
