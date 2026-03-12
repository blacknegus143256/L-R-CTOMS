<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\TailoringShop;
use App\Models\UserProfile;
use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\HasMany  ;
use Termwind\Components\Hr;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Add role to fillable
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    protected static function booted()
    {
        static::created(function ($user) {
            $user->profile()->create([]);
        });
    }

    public function tailoringShops(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\TailoringShop::class, 'shop_user');
    }
    public function shop()
{
    return $this->hasOne(TailoringShop::class, 'user_id');
}
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }
    public function orders():HasMany
    {
        return $this->hasMany(Order::class);
    }

}
