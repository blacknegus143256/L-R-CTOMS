<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopAttribute extends Model
{
    use HasFactory;

    protected $table = 'shop_attributes';

    protected $fillable = [
        'tailoring_shop_id',
        'attribute_type_id',
        'item_name',
        'price',
        'unit',
        'notes',
        'is_available',
        'image_url',
        'stock_quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    protected $appends = [
        'name',
        'attributeCategory',
    ];

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class, 'tailoring_shop_id');
    }

    public function attributeType(): BelongsTo
    {
        return $this->belongsTo(AttributeType::class, 'attribute_type_id');
    }

    public function getNameAttribute(): ?string
    {
        return $this->item_name ?: $this->attributeType?->name;
    }

    public function getAttributeCategoryAttribute(): ?array
    {
        $category = $this->attributeType?->attributeCategory;

        return $category ? $category->toArray() : null;
    }
}