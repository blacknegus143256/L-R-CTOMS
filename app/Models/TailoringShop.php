<?php

namespace App\Models;

use App\Models\Appointment;
use App\Models\ShopException;
use App\Models\ShopSchedule;
use App\Models\ShopStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TailoringShop extends Model
{
    use HasFactory;

    protected $appends = [
        'document_gov_id',
        'document_bir',
        'document_dti',
        'gov_id_status',
        'bir_2303_status',
        'dti_permit_status',
        'gov_id_rejection_reason',
        'bir_2303_rejection_reason',
        'dti_permit_rejection_reason',
        'status',
    ];

    protected $fillable = [
        'user_id',
        'logo_url',
        'shop_name',
        'payout_method',
        'payout_account',
        'document_qr_code',
        'slug',
        'description',
        'google_maps_link',
        'contact_role',
        'is_active',
        'shop_status_id',
        'terms_accepted_at',
        'slot_duration_minutes',
        'max_bookings_per_slot',
        'max_user_bookings_per_slot',
        'resubmission_reason',
        'requires_resubmission',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'slot_duration_minutes' => 'integer',
            'max_bookings_per_slot' => 'integer',
            'max_user_bookings_per_slot' => 'integer',
        ];
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ShopDocument::class, 'shop_id');
    }

    public function shopStatus(): BelongsTo
    {
        return $this->belongsTo(ShopStatus::class, 'shop_status_id');
    }

    public function shopSchedules(): HasMany
    {
        return $this->hasMany(ShopSchedule::class, 'shop_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ShopSchedule::class, 'shop_id');
    }

    public function shopExceptions(): HasMany
    {
        return $this->hasMany(ShopException::class, 'shop_id');
    }

    public function exceptions(): HasMany
    {
        return $this->hasMany(ShopException::class, 'shop_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'shop_id');
    }

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(AttributeType::class, 'shop_attributes', 'tailoring_shop_id', 'attribute_type_id')
            ->using(ShopAttributePivot::class)
            ->withPivot(['id', 'price', 'unit', 'item_name', 'image_url', 'notes', 'is_available', 'stock_quantity'])
            ->withTimestamps();
    }

    public function owner()
        
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shop_staff', 'shop_id', 'user_id')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function activeStaff(): BelongsToMany
    {
        return $this->staff()->wherePivot('is_active', true);
    }

    private function findDocumentByType(string $type): ?ShopDocument
    {
        if ($this->relationLoaded('documents')) {
            return $this->documents->firstWhere('document_type', $type);
        }

        return $this->documents()->where('document_type', $type)->first();
    }

    public function getDocumentGovIdAttribute(): ?string
    {
        return $this->findDocumentByType('gov_id')?->file_path;
    }

    public function getDocumentBirAttribute(): ?string
    {
        return $this->findDocumentByType('bir_2303')?->file_path;
    }

    public function getDocumentDtiAttribute(): ?string
    {
        return $this->findDocumentByType('dti_permit')?->file_path;
    }

    public function getGovIdStatusAttribute(): ?string
    {
        return $this->findDocumentByType('gov_id')?->status;
    }

    public function getBir2303StatusAttribute(): ?string
    {
        return $this->findDocumentByType('bir_2303')?->status;
    }

    public function getDtiPermitStatusAttribute(): ?string
    {
        return $this->findDocumentByType('dti_permit')?->status;
    }

    public function getGovIdRejectionReasonAttribute(): ?string
    {
        return $this->findDocumentByType('gov_id')?->rejection_reason;
    }

    public function getBir2303RejectionReasonAttribute(): ?string
    {
        return $this->findDocumentByType('bir_2303')?->rejection_reason;
    }

    public function getStatusAttribute(): ?string
    {
        if ($this->relationLoaded('shopStatus')) {
            return $this->shopStatus?->name;
        }

        return $this->shopStatus()?->value('name');
    }

    public function getDtiPermitRejectionReasonAttribute(): ?string
    {
        return $this->findDocumentByType('dti_permit')?->rejection_reason;
    }
}
