<?php

namespace Database\Seeders;

use App\Models\OrderStatus;
use Illuminate\Database\Seeder;

class OrderStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            'Requested',
            'Quoted',
            'Confirmed',
            'In Progress',
            'Ready for Pickup',
            'Completed',
            'Cancelled',
            'Declined',
            'Rejected',
        ];

        foreach ($statuses as $status) {
            OrderStatus::updateOrCreate(
                ['name' => $status],
                ['description' => null]
            );
        }
    }
}