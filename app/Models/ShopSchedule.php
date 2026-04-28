<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'day_of_week',
        'is_open',
        'open_time',
        'close_time',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_open' => 'boolean',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class, 'shop_id');
    }
}