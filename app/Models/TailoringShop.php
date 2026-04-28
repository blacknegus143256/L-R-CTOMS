<?php

namespace App\Models;

use App\Models\Appointment;
use App\Models\ShopException;
use App\Models\ShopSchedule;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TailoringShop extends Model
{
    use HasFactory;

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
        'status',
        'rejection_reason',
        'document_gov_id',
        'document_bir',
        'document_dti',
        'terms_accepted_at',
        'slot_duration_minutes',
        'max_bookings_per_slot',
        'max_user_bookings_per_slot',
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
->withPivot(['id', 'price', 'unit', 'item_name', 'image_url', 'notes', 'is_available'])
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
}
