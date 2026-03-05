<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class UserProfile extends Model
{
    use HasFactory;

    protected $table = 'users_profile';

    protected $fillable = [
        'phone',
        'barangay',
        'street',
        'latitude',
        'longitude',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}