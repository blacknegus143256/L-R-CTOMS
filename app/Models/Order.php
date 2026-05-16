<?php

namespace App\Models;

use BackedEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        
        'style_tag',
        'material_source',
        'design_image',
        'measurement_type',
        'fit_method_id',
        'production_min_days',
        'production_max_days',
        'production_started_at',
        'order_status_id',
        'status',
        'payout_status',
        'materials_received',
        'measurements_taken',
        'expected_completion_date',
        
        'notes',
        'required_materials',
        
        'is_rush',
        'rush_fee',
    ];

    protected function casts(): array
    {
        return [
            'expected_completion_date' => 'date',
            'production_started_at' => 'datetime',
            'total_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payout_status' => 'string',
            'required_materials' => 'array',
            'order_status_id' => 'integer',
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

    protected $appends = [
        'total_price',
        'is_urgent',
        'status',
        'payment_status',
        'payment_type',
        'manual_payment_reference_id',
        'manual_payment_proof_path',
        'amount_paid',
        'paymongo_link_id',
        'paymongo_payment_id',
    ];

    protected $with = ['user.profile', 'customer', 'service', 'items', 'reworkRequest', 'payment', 'measurements', 'order_measurements'];


    public static function normalizeMeasurementType(?string $measurementType): ?string
    {   
        if ($measurementType === null) {
            return null;
        }

        $value = strtolower(trim($measurementType));

        return match ($value) {
            'none', '' => self::MEASUREMENT_TYPE_NONE,
            'scheduled', 'workshop_fitting', 'inperson', 'in_shop', 'home_visit' => self::MEASUREMENT_TYPE_SCHEDULED,
            'profile', 'self_measured', 'self_measure' => self::MEASUREMENT_TYPE_PROFILE,
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

    public function getTotalPriceAttribute(): float
    {
        if ((float) ($this->total_amount ?? 0) > 0) {
            return (float) $this->total_amount;
        }

        $servicesTotal = $this->orderServices
            ? $this->orderServices->sum(fn ($orderService) => (float) $orderService->price * (int) $orderService->quantity)
            : 0;

        $itemsTotal = $this->items
            ? $this->items->sum(fn ($item) => (float) $item->price * (int) $item->quantity)
            : 0;

        return (float) $servicesTotal + (float) $itemsTotal + (float) ($this->rush_fee ?? 0);
    }

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignments(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'order_assignments', 'order_id', 'user_id')
            ->withTimestamps();
    }

    public function scopeForUser(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        if (in_array($user->role, ['store_staff', 'staff'], true)) {
            return $query->whereHas('assignments', function (Builder $assignmentQuery) use ($user) {
                $assignmentQuery->where('users.id', $user->id);
            });
        }

        return $query;
    }

    public function shop(): BelongsTo
    {
        return $this->tailoringShop();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'order_status_id');
    }

    public function fitMethod(): BelongsTo
    {
        return $this->belongsTo(FitMethod::class, 'fit_method_id');
    }

    public function orderServices(): HasMany
    {
        return $this->hasMany(OrderService::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(OrderMeasurement::class);
    }

    public function order_measurements(): HasMany
    {
        return $this->hasMany(OrderMeasurement::class);
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

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function getPaymentStatusAttribute(): string
    {
        return $this->payment?->payment_status ?? 'Pending';
    }

    public function getStatusAttribute(): ?string
    {
        if ($this->relationLoaded('status')) {
            return $this->getRelation('status')?->name;
        }

        return $this->status()->value('name');
    }

    public function setStatusAttribute($value): void
    {
        if ($value instanceof BackedEnum) {
            $value = $value->value;
        }

        if ($value === null || $value === '') {
            $this->attributes['order_status_id'] = null;
            return;
        }

        if (is_numeric($value)) {
            $this->attributes['order_status_id'] = (int) $value;
            return;
        }

        $statusId = OrderStatus::idByName((string) $value);
        if (! $statusId) {
            $statusId = OrderStatus::query()->create([
                'name' => (string) $value,
                'description' => null,
            ])->id;
        }

        $this->attributes['order_status_id'] = $statusId;
    }

    public function getPaymentTypeAttribute(): ?string
    {
        return $this->payment?->payment_type;
    }

    public function getManualPaymentReferenceIdAttribute(): ?string
    {
        return $this->payment?->manual_payment_reference_id;
    }

    public function getManualPaymentProofPathAttribute(): ?string
    {
        return $this->payment?->manual_payment_proof_path;
    }

    public function getAmountPaidAttribute(): float
    {
        return (float) ($this->payment?->amount ?? 0);
    }

    public function getPaymongoLinkIdAttribute(): ?string
    {
        return $this->payment?->paymongo_link_id;
    }

    public function getPaymongoPaymentIdAttribute(): ?string
    {
        return $this->payment?->paymongo_payment_id;
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


