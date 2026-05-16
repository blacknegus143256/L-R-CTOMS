<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public User $assignedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $serviceName = $this->order->service?->name ?? 'Order service';
        $assignedByName = $this->assignedBy->name ?? 'Shop owner';

        return [
            'type' => 'order_assigned',
            'message' => "You have been assigned to order #{$this->order->id}.",
            'order_id' => $this->order->id,
            'service_name' => $serviceName,
            'assigned_by_name' => $assignedByName,
            'url' => route('store.orders.show', $this->order->id),
        ];
    }
}