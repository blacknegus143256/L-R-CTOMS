<?php

namespace App\Notifications;

use App\Models\TailoringShop;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShopApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public TailoringShop $shop)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $ownerName = $notifiable->name ?: 'Store Owner';

        return (new MailMessage)
            ->subject('🎉 Your Shop has been Approved! - Stitch Central')
            ->greeting("Hello {$ownerName},")
            ->line("Great news! Your shop, {$this->shop->shop_name}, has been officially approved by our administrative team.")
            ->line('You can now log in, configure your master schedule, accept orders, and manage your tailoring services.')
            ->action('Go to Shop Dashboard', url('/store/dashboard'))
            ->line('Welcome to the platform!');
    }
}
