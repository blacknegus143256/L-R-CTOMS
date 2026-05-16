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
        $approvedStatusId = \App\Models\ShopStatus::firstOrCreate(
            ['name' => 'Approved'],
            ['description' => 'Shop is approved and active']
        )->id;

        // 1. Create or update the Super Admin
        User::updateOrCreate([
            'email' => 'admin@gmail.com',
        ], [
            'name' => 'CTOMS Admin',
            'password' => Hash::make('SuperAdmin123'),
            'role' => 'super_admin',
        ]);

        // 2. Create or update the Store Admin
        $storeOwner = User::updateOrCreate([
            'email' => 'owner@gmail.com',
        ], [
            'name' => 'Shop Owner Jane',
            'password' => Hash::make('Admin123'),
            'role' => 'store_admin',
        ]);

        // 3. Create a Shop for that Owner
        // This connects to your existing tailoring_shops table
        TailoringShop::updateOrCreate([
            'user_id' => $storeOwner->id,
        ], [
            'user_id' => $storeOwner->id,
            'shop_name' => 'Jane\'s Elegant Stitches',
            'shop_status_id' => $approvedStatusId,
        ]);

        $storeStaff = User::updateOrCreate([
            'email' => 'staff@gmail.com',
        ], [
            'name' => 'Shop Staff John',
            'password' => Hash::make('Admin123'),
            'role' => 'store_staff',
        ]);

        // 4. Create or update a Regular Customer
        User::updateOrCreate([
            'email' => 'sample@gmail.com',
        ], [
            'name' => 'Customer Juan',
            'password' => Hash::make('Admin123'),
            'role' => 'customer',
        ]);
    }
}