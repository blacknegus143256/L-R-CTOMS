<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Custom Sewing', 'slug' => 'custom-sewing'],
            ['name' => 'Alterations', 'slug' => 'alterations'],
            ['name' => 'Repairs', 'slug' => 'repairs'],
            ['name' => 'Embroidery', 'slug' => 'embroidery'],
            ['name' => 'Formal Wear', 'slug' => 'formal-wear'],
        ];

        foreach ($categories as $category) {
            ServiceCategory::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
