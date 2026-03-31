<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class UserProfile extends Model
{
    use HasFactory;

    protected $table = 'users_profile';

    protected $fillable = [
        'user_id',
        'phone',
        'barangay',
        'street',
        'latitude',
        'longitude',
        'neck',
        'chest',
        'waist',
        'hips',
        'sleeve_length',
        'shoulder_width',
        'inseam',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }
}