<?php

namespace App\Notifications;

use App\Models\OrderRework;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReworkRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public OrderRework $rework)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $shopName = $notifiable->tailoringShop?->shop_name ?? ($notifiable->name ?? 'Shop');
        $orderId = $this->rework->order_id;
        $category = $this->rework->category ?? 'Rework';
        $notes = $this->rework->notes ?? '';

        return (new MailMessage)
            ->subject('⚠️ Rework Requested for Order #' . $orderId)
            ->greeting("Hello {$shopName},")
            ->line("A customer has submitted a rework claim for Order #{$orderId}.")
            ->line("Category: {$category}")
            ->line('Customer Notes: "' . $notes . '"')
            ->action('Review Claim', url('/store/order/' . $orderId . '?tab=rework&highlight=rework'))
            ->line('Please evaluate the proof images provided by the customer and provide an official shop resolution.');
    }
}
