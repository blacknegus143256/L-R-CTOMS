<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMeasurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'measurement_name',
        'value',
        'unit',
        'notes',
        'last_verified_at',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'last_verified_at' => 'datetime',
    ];

    /**
     * Get the user that owns this measurement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get measurement value in a human-readable format.
     */
    public function getFormattedValue(): string
    {
        return $this->value ? "{$this->value} {$this->unit}" : 'Not set';
    }

    /**
     * Convert measurement value to centimeters.
     */
    public function convertToCm(): ?float
    {
        if (!$this->value) {
            return null;
        }

        return $this->unit === 'cm' ? $this->value : $this->value * 2.54;
    }

    /**
     * Convert measurement value to inches.
     */
    public function convertToIn(): ?float
    {
        if (!$this->value) {
            return null;
        }

        return $this->unit === 'in' ? $this->value : $this->value / 2.54;
    }
}
