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
        'user_id',
        'shop_name',
        'contact_person',
        'contact_role',
        'address',
        'contact_number',
        'is_active',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean'
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
        return $this->belongsToMany(AttributeType::class, 'shop_attributes', 'tailoring_shop_id', 'attribute_type_id')
            ->withPivot(['price', 'unit', 'item_name', 'notes', 'is_available'])
            ->withTimestamps();
    }

    public function owner()
        
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
