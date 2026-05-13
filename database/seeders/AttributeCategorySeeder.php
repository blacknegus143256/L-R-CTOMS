<?php
namespace Database\Seeders;

use App\Models\AttributeCategory;
use Illuminate\Database\Seeder;

class AttributeCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Fabric',
            'Thread',
            'Fasteners',
            'Elastic',
            'Trims',
            'Support',
        ];

        foreach ($categories as $category) {
            AttributeCategory::updateOrCreate(
                ['slug' => strtolower($category)],
                ['name' => $category]
            );
        }
    }
}