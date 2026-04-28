<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'tailoring_shop_id',
        'service_category_id',
        'service_name',
        'service_description',
        'price',
        'checkout_type',
        'duration_days',
        'is_available',
        'rush_service_available',
        'appointment_required',
        'notes',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'checkout_type' => 'string',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
        'appointment_required' => 'boolean',
            'image' => 'string',
        ];
    }

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class);
    }

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
