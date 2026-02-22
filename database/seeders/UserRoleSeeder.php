<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TailoringShop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Super Admin
        User::create([
            'name' => 'Super Admin Patrick',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('SuperAdmin123'),
            'role' => 'super_admin',
        ]);

        // 2. Create Store Admin
        $storeOwner = User::create([
            'name' => 'Shop Owner Jane',
            'email' => 'owner@gmail.com',
            'password' => Hash::make('Admin123'),
            'role' => 'store_admin',
        ]);

        // 3. Create a Shop for that Owner
        // This connects to your existing tailoring_shops table
        TailoringShop::create([
            'user_id' => $storeOwner->id,
            'shop_name' => 'Jane\'s Elegant Stitches',
            'address' => 'Dumaguete City, Negros Oriental',
            'status' => 'approved', // So it shows up immediately
        ]);

        // 4. Create a Regular Customer
        User::create([
            'name' => 'Customer Juan',
            'email' => 'sample@gmail.com',
            'password' => Hash::make('Sample123'),
            'role' => 'customer',
        ]);
    }
}