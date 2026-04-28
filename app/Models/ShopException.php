<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopException extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'date',
        'is_closed',
        'open_time',
        'close_time',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_closed' => 'boolean',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class, 'shop_id');
    }
}