<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    public const MEASUREMENT_TYPE_PROFILE = 'profile';
    public const MEASUREMENT_TYPE_SCHEDULED = 'scheduled';
    public const MEASUREMENT_TYPE_NONE = 'none';

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
        'production_min_days',
        'production_max_days',
        'production_started_at',
        'payment_status',
        'payment_type',
        'manual_payment_reference_id',
        'manual_payment_proof_path',
        'total_amount',
        'amount_paid',
        'payout_status',
        'paymongo_link_id',
        'paymongo_payment_id',
        'materials_received',
        'measurements_taken',
        'status',
        'expected_completion_date',
        'total_price',
        'notes',
        'required_materials',
        'rush_order',
        'is_rush',
        'rush_fee',
    ];

    protected function casts(): array
    {
        return [
            'status' => \App\Enums\OrderStatus::class,
            'expected_completion_date' => 'date',
            'production_started_at' => 'datetime',
            'material_dropoff_date' => 'date',
            'total_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payout_status' => 'string',
            'measurement_snapshot' => 'array',
            'required_measurements' => 'array',
            'submitted_measurements' => 'array',
            'required_materials' => 'array',
            'payment_status' => 'string',
            'payment_type' => 'string',
            'manual_payment_reference_id' => 'string',
            'manual_payment_proof_path' => 'string',
            'materials_received' => 'boolean',
            'measurements_taken' => 'boolean',
            'rush_order' => 'boolean',
            'is_rush' => 'boolean',
            'rush_fee' => 'decimal:2',
            'proof_images' => 'array',
        ];
    }

    protected $appends = ['is_urgent'];

    protected $with = ['user.profile', 'customer', 'service', 'items', 'reworkRequest'];

    public static function normalizeMeasurementType(?string $measurementType): ?string
    {   
        if ($measurementType === null) {
            return null;
        }

        $value = strtolower(trim($measurementType));

        return match ($value) {
            'none', '' => self::MEASUREMENT_TYPE_NONE,
            'scheduled', 'workshop_fitting', 'inperson' => self::MEASUREMENT_TYPE_SCHEDULED,
            'profile', 'self_measured' => self::MEASUREMENT_TYPE_PROFILE,
            default => $measurementType,
        };
    }

    public static function requiresInShopMeasurements(?string $measurementType): bool
    {
        return self::normalizeMeasurementType($measurementType) === self::MEASUREMENT_TYPE_SCHEDULED;
    }

    public static function hasNoRequiredMeasurements(?string $measurementType): bool
    {
        return self::normalizeMeasurementType($measurementType) === self::MEASUREMENT_TYPE_NONE;
    }

    /**
     * Computed accessor: Order is urgent if it's marked as rush OR deadline is within 2 days.
     */
    public function getIsUrgentAttribute(): bool
    {
        if ($this->is_rush) {
            return true;
        }

        if ($this->expected_completion_date) {
            return $this->expected_completion_date->lessThanOrEqualTo(now()->addDays(2));
        }

        return false;
    }

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

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(OrderPhoto::class);
    }

    public function reworkRequest(): HasOne
    {
        return $this->hasOne(OrderRework::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(OrderLog::class)->orderBy('created_at', 'desc');
    }

    public function latestLog(): HasOne
    {
        return $this->hasOne(OrderLog::class)->latestOfMany();
    }

    public function tailoring_shop()
    {
        return $this->belongsTo(TailoringShop::class);
    }
}

