<?php

namespace Database\Seeders;

use App\Models\ShopStatus;
use Illuminate\Database\Seeder;

class ShopStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['name' => 'Pending', 'description' => 'Shop is under review'],
            ['name' => 'Approved', 'description' => 'Shop is approved and active'],
            ['name' => 'Rejected', 'description' => 'Shop application was rejected'],
            ['name' => 'Suspended', 'description' => 'Shop is temporarily suspended'],
        ];

        foreach ($statuses as $status) {
            ShopStatus::firstOrCreate(
                ['name' => $status['name']],
                ['description' => $status['description']]
            );
        }
    }
}
