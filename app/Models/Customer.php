<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tailoring_shop_id',
        'name',
        'phone_number',
        'email',
        'address',
        'measurements',
    ];

    protected function casts(): array
    {
        return [
            'measurements' => 'array',
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
