<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a paginated list of all platform orders for the Super Admin.
     */
    public function index()
    {
        $orders = Order::with([
            'user:id,name,email',
            'customer:id,name,email',
            'orderServices.service:id,service_name,price',
            'tailoringShop:id,shop_name,user_id',
            'tailoringShop.user:id,name',
            'payment',
        ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Orders', [
            'orders' => $orders,
        ]);
    }
}
