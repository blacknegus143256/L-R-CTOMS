<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $shopName = $notifiable->tailoringShop?->shop_name ?? ($notifiable->name ?? 'Shop');
        $customerName = $this->order->customer?->name ?? 'Customer';
        $serviceName = $this->order->service?->name ?? 'Service';
        $fitMethod = $this->order->fitMethod?->name ?? '';

        return (new MailMessage)
            ->subject('New Order Received! (Order #' . $this->order->id . ')')
            ->greeting("Hello {$shopName},")
            ->line("You have received a new tailoring request from {$customerName}.")
            ->line("Service: {$serviceName} | Fit Method: {$fitMethod}")
            ->action('Review & Send Quote', url('/store/order/' . $this->order->id))
            ->line('Please review the customer\'s design notes and issue a financial quote as soon as possible.');
    }
}
