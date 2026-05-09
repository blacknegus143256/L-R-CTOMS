<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopStatus extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    public function shops(): HasMany
    {
        return $this->hasMany(TailoringShop::class, 'shop_status_id');
    }

    public static function idByName(string $name): ?int
    {
        return static::query()->where('name', $name)->value('id');
    }
}
