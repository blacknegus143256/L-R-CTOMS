<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderMeasurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'measurement_name',
        'measurement_value',
        'unit',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}