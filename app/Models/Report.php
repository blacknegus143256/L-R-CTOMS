<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Order;
use App\Models\User;
use App\Models\TailoringShop;

class Report extends Model
{
    protected $fillable = [
        'reporter_id',
        'reported_id',
        'shop_id',
        'order_id',
        'reason',
        'details',
        'status',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_id');
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(TailoringShop::class, 'shop_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
