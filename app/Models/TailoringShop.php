<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TailoringShop extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_name',
        'contact_person',
        'contact_role',
        'address',
        'contact_number',
        'is_active',
        'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_approved' => 'boolean',
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

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, 'shop_attributes')
            ->withPivot(['price', 'unit', 'notes', 'is_available'])
            ->withTimestamps();
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shop_user');
    }
}
