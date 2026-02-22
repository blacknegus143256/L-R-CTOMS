<?php

namespace Database\Seeders;

use App\Models\TailoringShop;
use Illuminate\Database\Seeder;
use App\Models\User;

class TailoringShopSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('role', 'store_admin')->first();
        $shop1 = TailoringShop::create([
            'user_id' => $owner ? $owner->id : null,
            'shop_name' => 'Dumaguete Tailoring Co.',
            'contact_person' => 'Maria Santos',
            'contact_role' => 'Owner',
            'address' => '123 Rizal Ave, Dumaguete City',
            'contact_number' => '+63 912 345 6789',
            'is_active' => true,
            'status' => 'pending',
        ]);

        foreach (
            [
                ['service_name' => 'Hemming', 'price' => 150.00, 'duration_days' => '2-3 days'],
                ['service_name' => 'Custom Barong', 'price' => 2500.00, 'duration_days' => '1 week'],
                ['service_name' => 'Dress Alteration', 'price' => 400.00, 'duration_days' => '3-5 days'],
            ] as $s
        ) {
            $shop1->services()->create($s);
        }

        $shop2 = TailoringShop::create([
            'user_id' => $owner ? $owner->id : null,
            'shop_name' => 'Stitch Perfect',
            'contact_person' => 'Juan Dela Cruz',
            'contact_role' => 'Owner',
            'address' => '45 Silliman Ave, Dumaguete City',
            'contact_number' => '+63 918 765 4321',
            'is_active' => true,
            'status' => 'approved',
        ]);

        foreach (
            [
                ['service_name' => 'Pants Alteration', 'price' => 200.00, 'duration_days' => '2 days'],
                ['service_name' => 'Blazer Fitting', 'price' => 1800.00, 'duration_days' => '5-7 days'],
            ] as $s
        ) {
            $shop2->services()->create($s);
        }
    }
}
