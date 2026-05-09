<?php

namespace App\Models;

use BackedEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'payment_type',
        'payment_status_id',
        'payment_status',
        'amount',
        'manual_payment_reference_id',
        'manual_payment_proof_path',
        'paymongo_link_id',
        'paymongo_payment_id',
    ];

    protected $appends = ['payment_status'];

    protected function casts(): array
    {
        return [
            'payment_status_id' => 'integer',
            'amount' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(PaymentStatus::class, 'payment_status_id');
    }

    public function getPaymentStatusAttribute(): ?string
    {
        if ($this->relationLoaded('status')) {
            return $this->getRelation('status')?->name;
        }

        return $this->status()->value('name');
    }

    public function setPaymentStatusAttribute($value): void
    {
        if ($value instanceof BackedEnum) {
            $value = $value->value;
        }

        if ($value === null || $value === '') {
            $this->attributes['payment_status_id'] = null;
            return;
        }

        if (is_numeric($value)) {
            $this->attributes['payment_status_id'] = (int) $value;
            return;
        }

        $statusId = PaymentStatus::idByName((string) $value);
        if (! $statusId) {
            $statusId = PaymentStatus::query()->create([
                'name' => (string) $value,
                'description' => null,
            ])->id;
        }

        $this->attributes['payment_status_id'] = $statusId;
    }
}