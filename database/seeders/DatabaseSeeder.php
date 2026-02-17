<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

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

        $this->call(TailoringShopSeeder::class);
        $this->call(AttributeSeeder::class);

        // Attach first shop to this user so they can use the dashboard
        $user->tailoringShops()->attach(\App\Models\TailoringShop::first()->id);
    }
}
