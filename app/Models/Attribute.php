<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Attribute extends Model
{
    use HasFactory;

    protected $fillable = ['attribute_category_id', 'name'];

    public function attributeCategory(): BelongsTo
    {
        return $this->belongsTo(AttributeCategory::class, 'attribute_category_id');
    }

    public function tailoringShops(): BelongsToMany
    {
        return $this->belongsToMany(TailoringShop::class, 'shop_attributes')
            ->withPivot(['price', 'unit', 'notes', 'is_available'])
            ->withTimestamps();
    }
}
