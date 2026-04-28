<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class OrderRework extends Model
{
    protected $fillable = [
        'order_id',
        'reason_category',
        'customer_notes',
        'tailor_response_notes',
        'status',
        'proof_images',
    ];

    protected function casts(): array
    {
        return [
            'proof_images' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
