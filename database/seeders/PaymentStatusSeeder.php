<?php

namespace Database\Seeders;

use App\Models\PaymentStatus;
use Illuminate\Database\Seeder;

class PaymentStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            'Pending',
            'Partial',
            'Paid',
            'Refunded',
            'Failed',
        ];

        foreach ($statuses as $status) {
            PaymentStatus::firstOrCreate(
                ['name' => $status],
                ['description' => null]
            );
        }
    }
}