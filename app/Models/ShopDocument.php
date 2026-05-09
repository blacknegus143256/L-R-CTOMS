<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'document_type',
        'file_path',
        'status',
        'rejection_reason',
    ];

    public function tailoringShop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class, 'shop_id');
    }
}
