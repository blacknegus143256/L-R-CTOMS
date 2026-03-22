<?php

namespace App\Http\Controllers;

use App\Models\AttributeCategory;
use App\Models\Service;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Home', [
            'categories' => AttributeCategory::with('attributeTypes')->get(),
            'services' => Service::with('serviceCategory')->get(),
            'shops' => TailoringShop::where('status', 'approved')
                ->where('is_active', true)
->with(['services.serviceCategory', 'attributes', 'user.profile'])
                ->get(),
            'uniqueServiceCategories' => Service::with('serviceCategory')
                ->get()
                ->pluck('service_category.name')
                ->filter()
                ->unique()
                ->values()
                ->all(),
        ]);
    }
}

