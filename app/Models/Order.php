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
        'customer_id',
        'service_id',
        'style_tag',
        'material_source',
        'material_dropoff_date',
        'design_image',
        'measurement_type',
        'measurement_date',
        'measurement_snapshot',
        'status',
        'expected_completion_date',
        'total_price',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_completion_date' => 'date',
            'material_dropoff_date' => 'date',
            'total_price' => 'decimal:2',
            'measurement_snapshot' => 'array',
            'required_measurements' => 'array',
            'submitted_measurements' => 'array',
        ];
    }

    protected $with = ['user.profile', 'customer', 'service', 'items'];

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

public function tailoring_shop()
{
    return $this->belongsTo(TailoringShop::class);
}
}
