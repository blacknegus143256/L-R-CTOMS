<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ShopAttributePivot extends Pivot
{
    public static $snakeAttributes = false;

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    protected $appends = [
        'isActuallyAvailable',
        'is_actually_available',
    ];

    public function getIsActuallyAvailableAttribute(): bool
    {
        return (bool) $this->is_available && (float) ($this->stock_quantity ?? 0) > 0;
    }

    protected static function booted(): void
    {
        static::saving(function (self $pivot) {
            if ((float) ($pivot->stock_quantity ?? 0) <= 0) {
                $pivot->is_available = false;
            }
        });
    }
}