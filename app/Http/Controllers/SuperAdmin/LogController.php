<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderLog;
use Inertia\Inertia;

class LogController extends Controller
{
    public function index()
    {
        $logs = OrderLog::with([
            'order:id,order_status_id,total_amount,tailoring_shop_id,user_id,created_at',
            'order.payment',
            'user:id,name,role',
        ])
            ->latest('created_at')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('SuperAdmin/AuditLogs/Index', [
            'logs' => $logs,
        ]);
    }

    public function showOrder(Order $order)
    {
        $order->load([
            // user who created the order (system customer user account)
            'user:id,name,email,role',
            // customer record and its linked user (for richer customer info)
            'customer:id,name,email',
            'customer.user:id,name,email',
            // primary service and any order services
            'service:id,service_name,price',
            'orderServices.service:id,service_name,price',
            // tailoring shop and its owner (shop user)
            'tailoringShop:id,shop_name,user_id',
            'tailoringShop.user:id,name,email',
            // payment and logs with the user who performed actions
            'payment',
            'logs.user:id,name,role',
        ]);

        // Provide compatibility aliases for views that expect `shop` and `service` keys
        if ($order->relationLoaded('tailoringShop')) {
            $order->setRelation('shop', $order->getRelation('tailoringShop'));
        }

        // If the order has orderServices, expose the first service as `service` for legacy views
        if ($order->relationLoaded('orderServices') && $order->orderServices->isNotEmpty()) {
            $firstService = $order->orderServices->first()->service ?? null;
            if ($firstService) {
                $order->setRelation('service', $firstService);
            }
        }

        return Inertia::render('SuperAdmin/AuditLogs/OrderView', [
            'order' => $order,
        ]);
    }
}
