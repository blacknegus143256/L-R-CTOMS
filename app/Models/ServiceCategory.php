<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
        'slug',
    ];

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'service_category_id');
    }
}
