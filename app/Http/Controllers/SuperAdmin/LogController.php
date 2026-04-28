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
            'order:id,status,payment_status,total_price,tailoring_shop_id,user_id,created_at',
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
            'user:id,name,email,role',
            'customer:id,name,email',
            'service:id,service_name,price',
            'tailoringShop:id,shop_name',
            'logs.user:id,name,role',
        ]);

        return Inertia::render('SuperAdmin/AuditLogs/OrderView', [
            'order' => $order,
        ]);
    }
}
