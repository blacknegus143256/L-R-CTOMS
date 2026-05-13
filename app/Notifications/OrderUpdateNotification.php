<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class OrderUpdateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $updateType,
        public ?string $customMessage = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $customerName = $notifiable->name ?? 'Customer';
        $shopName = $this->order->tailoringShop?->shop_name ?? 'Your Shop';
        $orderId = $this->order->id;

        // Resolve amount paid safely
        $amountPaid = null;
        if (isset($this->order->amount_paid)) {
            $amountPaid = $this->order->amount_paid;
        } elseif (isset($this->order->paid_amount)) {
            $amountPaid = $this->order->paid_amount;
        } else {
            try {
                $amountPaid = $this->order->payments()?->where('payment_status', 'Paid')->sum('amount');
            } catch (\Throwable $e) {
                Log::debug('Unable to compute amountPaid in OrderUpdateNotification: ' . $e->getMessage());
                $amountPaid = 0;
            }
        }

        $amountPaidFormatted = is_null($amountPaid) ? '0.00' : number_format((float) $amountPaid, 2);

        $mail = (new MailMessage)
            ->greeting("Hello {$customerName},");

        switch ($this->updateType) {
            case 'quote_sent':
                $mail->subject("Action Required: Quote Ready for Order #{$orderId}")
                    ->line("{$shopName} has reviewed your request and issued a financial quote.")
                    ->action('Review & Accept Quote', url("/my-orders/{$orderId}?tab=details&highlight=quote"));
                break;

            case 'payment_verified':
                $mail->subject("Payment Verified - Order #{$orderId} Confirmed")
                    ->line("We have successfully verified your payment of ₱{$amountPaidFormatted}. Your order is now Confirmed and {$shopName} will begin preparations.")
                    ->action('Track Order', url("/my-orders/{$orderId}?tab=tracking"));
                break;

            case 'ready_for_pickup':
                $mail->subject("🛍️ Your Order is Ready for Pickup! (Order #{$orderId})")
                    ->line("Great news! {$shopName} has finished your garment. It is now ready for pickup.")
                    ->action('View Final Details', url("/my-orders/{$orderId}"));
                break;

            case 'rework_accepted':
                $mail->subject("Rework Claim Accepted (Order #{$orderId})")
                    ->line("{$shopName} has accepted your rework claim.")
                    ->line('Tailor Notes: "' . ($this->customMessage ?? '') . '"')
                    ->action('View Claim Details', url("/my-orders/{$orderId}?tab=rework"));
                break;

            case 'rework_rejected':
                $mail->subject("Rework Claim Update (Order #{$orderId})")
                    ->line("{$shopName} has declined your rework claim.")
                    ->line('Tailor Notes: "' . ($this->customMessage ?? '') . '"')
                    ->action('View Claim Details', url("/my-orders/{$orderId}?tab=rework"));
                break;

            default:
                $mail->subject("Order #{$orderId} Update")
                    ->line($this->customMessage ?? 'There is an update regarding your order.')
                    ->action('View Order', url("/my-orders/{$orderId}"));
                break;
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'update_type' => $this->updateType,
            'custom_message' => $this->customMessage,
        ];
    }
}
