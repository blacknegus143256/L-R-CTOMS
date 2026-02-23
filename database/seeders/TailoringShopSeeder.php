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
                ['service_category' => 'Alterations', 'starting_price' => 150.00, 'turnaround_time' => '2-3 days', 'service_description' => 'Hemming services for pants and skirts', 'is_available' => true],
                ['service_category' => 'Custom Sewing', 'starting_price' => 2500.00, 'turnaround_time' => '1 week', 'service_description' => 'Custom Barong Tagalog', 'is_available' => true],
                ['service_category' => 'Alterations', 'starting_price' => 400.00, 'turnaround_time' => '3-5 days', 'service_description' => 'Dress alteration and fitting', 'is_available' => true],
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
                ['service_category' => 'Alterations', 'starting_price' => 200.00, 'turnaround_time' => '2 days', 'service_description' => 'Pants alteration and hemming', 'is_available' => true],
                ['service_category' => 'Formal Wear', 'starting_price' => 1800.00, 'turnaround_time' => '5-7 days', 'service_description' => 'Custom blazer fitting and tailoring', 'is_available' => true, 'appointment_required' => true],
            ] as $s
        ) {
            $shop2->services()->create($s);
        }
        $shop3 = TailoringShop::create([
            'user_id' => $owner ? $owner->id : null,
            'shop_name' => 'Stitch ImPerfect',
            'contact_person' => 'Arvinidos De Nigga',
            'contact_role' => 'Owner',
            'address' => '45 Silliman Ave, Dumaguete City',
            'contact_number' => '+63 918 765 4321',
            'is_active' => true,
            'status' => 'approved',
        ]);

        foreach (
            [
                ['service_category' => 'Alterations', 'starting_price' => 250.00, 'turnaround_time' => '1 days', 'service_description' => 'Pants alteration and hemming', 'is_available' => true],
                ['service_category' => 'Formal Wear', 'starting_price' => 2500.00, 'turnaround_time' => '3-5 days', 'service_description' => 'Custom blazer fitting and tailoring', 'is_available' => true, 'appointment_required' => true],
            ] as $s
        ) {
            $shop3->services()->create($s);
        }
    }
}
