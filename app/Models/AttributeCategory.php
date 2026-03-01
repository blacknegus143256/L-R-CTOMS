<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttributeCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function attributeTypes(): HasMany
    {
        return $this->hasMany(AttributeType::class, 'attribute_category_id');
    }
}
