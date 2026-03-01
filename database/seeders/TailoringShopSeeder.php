<?php

namespace Database\Seeders;

use App\Models\TailoringShop;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;
use App\Models\User;

class TailoringShopSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('role', 'store_admin')->first();
        
        // Get service category IDs
        $customSewingCat = ServiceCategory::where('slug', 'custom-sewing')->first();
        $alterationsCat = ServiceCategory::where('slug', 'alterations')->first();
        $formalWearCat = ServiceCategory::where('slug', 'formal-wear')->first();
        $repairsCat = ServiceCategory::where('slug', 'repairs')->first();
        $embroideryCat = ServiceCategory::where('slug', 'embroidery')->first();
        
        $shop1 = TailoringShop::create([
            'user_id' => $owner ? $owner->id : null,
            'shop_name' => 'Dumaguete Tailoring Co.',
            'contact_person' => 'Maria Santos',
            'contact_role' => 'Owner',
            'address' => '123 Rizal Ave, Dumaguete City',
            'contact_number' => '+63 912 345 6789',
            'is_active' => true,
            'status' => 'approved',
        ]);

        $shop1->services()->createMany([
            [
                'service_category_id' => $alterationsCat?->id ,
                'service_name' => 'Hemming',
                'price' => 150.00,
                'duration_days' => '2-3 days',
                'service_description' => 'Hemming services for pants and skirts',
                'is_available' => true
            ],
            [
                'service_category_id' => $alterationsCat?->id ,
                'service_name' => 'Hemming',
                'price' => 150.00,
                'duration_days' => '2-3 days',
                'service_description' => 'Hemming services for pants and skirts',
                'is_available' => true
            ],
            [
                'service_category_id' => $customSewingCat?->id,
                'service_name' => 'Barong Tagalog',
                'price' => 2500.00,
                'duration_days' => '1 week',
                'service_description' => 'Custom Barong Tagalog',
                'is_available' => true
            ],
            [
                'service_category_id' => $alterationsCat?->id,
                'service_name' => 'Dress Alteration',
                'price' => 400.00,
                'duration_days' => '3-5 days',
                'service_description' => 'Dress alteration and fitting',
                'is_available' => true
            ],
        ]);

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

        $shop2->services()->createMany([
            [
                'service_category_id' => $alterationsCat?->id,
                'service_name' => 'Pants Alteration',
                'price' => 200.00,
                'duration_days' => '2 days',
                'service_description' => 'Pants alteration and hemming',
                'is_available' => true
            ],
            [
                'service_category_id' => $formalWearCat?->id,
                'service_name' => 'Blazer',
                'price' => 1800.00,
                'duration_days' => '5-7 days',
                'service_description' => 'Custom blazer fitting and tailoring',
                'is_available' => true,
                'appointment_required' => true
            ],
            [
                'service_category_id' => $embroideryCat?->id,
                'service_name' => 'Embroidery',
                'price' => 500.00,
                'duration_days' => '3-5 days',
                'service_description' => 'Custom embroidery work',
                'is_available' => true
            ],
        ]);

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

        $shop3->services()->createMany([
            [
                'service_category_id' => $alterationsCat?->id,
                'service_name' => 'Quickie',
                'price' => 250.00,
                'duration_days' => '1 day',
                'service_description' => 'Quick pants alteration and hemming',
                'is_available' => true
            ],
            [
                'service_category_id' => $formalWearCat?->id,
                'service_name' => 'Blazer',
                'price' => 2500.00,
                'duration_days' => '3-5 days',
                'service_description' => 'Custom blazer fitting and tailoring',
                'is_available' => true,
                'appointment_required' => true
            ],
            [
                'service_category_id' => $repairsCat?->id,
                'service_name' => 'Clothing Repairs',
                'price' => 100.00,
                'duration_days' => '1-2 days',
                'service_description' => 'Clothing repairs and patches',
                'is_available' => true
            ],
        ]);
    }
}
