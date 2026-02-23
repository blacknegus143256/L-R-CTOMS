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
        'service_category',
        'service_description',
        'starting_price',
        'turnaround_time',
        'is_available',
        'rush_service_available',
        'appointment_required',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starting_price' => 'decimal:2',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
        ];
    }

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
