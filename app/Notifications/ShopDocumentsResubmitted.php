<?php

namespace App\Notifications;

use App\Models\TailoringShop;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ShopDocumentsResubmitted extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @param TailoringShop $shop
     * @param string|null $message
     * @param array $resubmittedDocuments List of document types that were resubmitted
     */
    public function __construct(
        public TailoringShop $shop,
        public ?string $message = null,
        public array $resubmittedDocuments = []
    ) {
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $documentLabels = [
            'document_gov_id' => 'Government ID',
            'document_bir' => 'BIR 2303',
            'document_dti' => "DTI/Mayor's Permit",
        ];

        $resubmittedLabels = array_map(
            fn($doc) => $documentLabels[$doc] ?? $doc,
            $this->resubmittedDocuments
        );

        return [
            'shop_id' => $this->shop->id,
            'shop_name' => $this->shop->shop_name,
            'message' => $this->message ?? ('Shop ' . $this->shop->shop_name . ' has updated their documents and is ready for re-evaluation.'),
            'type' => 'shop_documents_resubmitted',
            'documents' => $this->resubmittedDocuments,
            'action_url' => route('super-admin.shops.index'),
        ];
    }
}
