<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TailoringShop;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Shop Manager',
            'email' => 'shop@example.com',
        ]);
        
        $this->call([
            UserRoleSeeder::class,
            ServiceCategorySeeder::class,
            TailoringShopSeeder::class,
            AttributeCategorySeeder::class,
            AttributeTypeSeeder::class,
        ]);
        
        TailoringShop::create([
            'user_id' => $user->id,
            'shop_name' => 'Example Tailoring Shop',
            'contact_person' => 'John Doe',
            'contact_role' => 'Manager',
            'address' => '123 Main St, Dumaguete City',
            'contact_number' => '+63 912 345 6789',
            'is_active' => true,
            'status' => 'approved',
        ]);
    }
}
