<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use App\Models\TailoringShop;
use App\Models\UserProfile;
use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany  ;
use Termwind\Components\Hr;

class User extends Authenticatable implements MustVerifyEmail
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
        'shop_name', // Add shop_name to fillable
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
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                []
            );
        });
    }


    public function tailoringShops()
    {
        return $this->hasMany(\App\Models\TailoringShop::class, 'user_id');
    }

    public function tailoringShop(): HasOne
    {
        return $this->hasOne(TailoringShop::class, 'user_id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }
    public function orders():HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(UserMeasurement::class);
    }

    /**
     * Override to send custom OTP verification email instead of default Laravel verification email.
     */
    public function sendEmailVerificationNotification(): void
    {
        // Generate a new 6-digit code
        $code = (string) random_int(100000, 999999);
        
        // Hash and save the code with 15-minute expiry
        $this->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        // Send custom OTP notification instead of default verification email
        $this->notify(new \App\Notifications\VerifyEmailCodeNotification($code));
    }
}
