<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderUpdatedNotification extends Notification
{
    use Queueable;

    /**
     * @param Order $order
     * @param string $message
     * @param string $type Notification type: order_created, measurement_requested, measurement_submitted, status_updated, quote_sent
     */
    public function __construct(
        public Order $order,
        public string $message,
        public string $type = 'status_updated',
        public ?string $reason = null,
        public ?string $actor = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'message' => $this->message,
            'type' => $this->type,
            'reason' => $this->reason,
            'actor' => $this->actor,
            'order_status' => $this->order->status instanceof \App\Enums\OrderStatus
                ? $this->order->status->value
                : (string) $this->order->status,
            'shop_name' => $this->order->tailoringShop?->shop_name,
            'customer_name' => $this->order->customer?->name,
        ];
    }
}
