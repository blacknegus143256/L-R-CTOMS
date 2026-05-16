<?php

namespace App\Models;

use App\Notifications\VerifyEmailCodeNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use App\Models\TailoringShop;
use App\Models\UserProfile;
use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany  ;
use Termwind\Components\Hr;

class User extends Authenticatable implements MustVerifyEmail
{
    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_STORE_ADMIN = 'store_admin';
    public const ROLE_STORE_STAFF = 'store_staff';
    public const ROLE_CUSTOMER = 'customer';

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

    public function workplaces(): BelongsToMany
    {
        return $this->belongsToMany(TailoringShop::class, 'shop_staff', 'user_id', 'shop_id')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function employers(): BelongsToMany
    {
        return $this->workplaces();
    }

    public function assignedOrders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_assignments', 'user_id', 'order_id')
            ->withTimestamps();
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(UserMeasurement::class);
    }

    public function sendVerificationCodeNotification(string $code): void
    {
        $notification = new VerifyEmailCodeNotification($code);

        // Allow optional environment-driven override for where super-admin verification codes go.
        // Set FORCE_SUPER_ADMIN_VERIFICATION_EMAIL in the environment to forward codes.
        $override = env('FORCE_SUPER_ADMIN_VERIFICATION_EMAIL');

        if ($this->role === self::ROLE_SUPER_ADMIN && !empty($override)) {
            Notification::route('mail', $override)->notify($notification);
            return;
        }

        $this->notify($notification);
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
        $this->sendVerificationCodeNotification($code);
    }
}
