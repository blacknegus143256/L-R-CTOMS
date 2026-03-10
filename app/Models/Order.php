<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tailoring_shop_id',
        'user_id',
        'service_id',
        'status',
        'expected_completion_date',
        'total_price',
        'notes',
    ];

    protected $with = ['user', 'service', 'items'];

    protected function casts(): array
    {
        return [
            'expected_completion_date' => 'date',
            'total_price' => 'decimal:2',
        ];
    }

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(user::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
