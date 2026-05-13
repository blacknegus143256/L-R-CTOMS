<?php

namespace App\Notifications;

use App\Models\TailoringShop;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentResubmissionRequired extends Notification
{
    use Queueable;

    /**
     * @param TailoringShop $shop
     * @param string $reason The reason why documents need to be resubmitted
     */
    public function __construct(
        public TailoringShop $shop,
        public string $reason
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  object  $notifiable
     * @return array
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'document_resubmission_required',
            'title' => 'Document Resubmission Required',
            'message' => 'Your shop documents require resubmission. Please review the details and submit the corrected documents.',
            'reason' => $this->reason,
            'shop_id' => $this->shop->id,
            'shop_name' => $this->shop->shop_name,
            'url' => route('store.onboarding') . '?startStep=2',
        ];
    }
}
