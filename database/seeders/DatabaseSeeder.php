<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TailoringShop;
use App\Models\ShopStatus;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstOrCreate([
            'email' => 'shop@example.com',
        ], [
            'name' => 'Shop Manager',
            'password' => bcrypt('password'),
            'role' => 'store_admin',
        ]);
        
        $this->call([
            ShopStatusSeeder::class,
            UserRoleSeeder::class,
            OrderStatusSeeder::class,
            PaymentStatusSeeder::class,
            ServiceCategorySeeder::class,
            AttributeCategorySeeder::class,
            AttributeTypeSeeder::class,
        ]);

        // Create default shop first
        TailoringShop::firstOrCreate([
            'user_id' => $user->id,
        ], [
            'user_id' => $user->id,
            'shop_name' => 'Example Tailoring Shop',
            'contact_person' => 'John Doe',
            'contact_role' => 'Manager',
            'is_active' => true,
            'shop_status_id' => ShopStatus::where('name', 'Approved')->value('id'),
        ]);

        // Then seed shop schedules (now that shops exist)
        $this->call(ShopScheduleSeeder::class);
    }
}
