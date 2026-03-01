<?php
namespace Database\Seeders;

use App\Models\AttributeCategory;
use App\Models\AttributeTypes;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttributeCategorySeeder extends Seeder
{
    public function run()
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
            DB::table('attribute_categories')->updateOrInsert(
                ['name' => $category],
                ['slug' => strtolower($category)]
            );
        }
    }
}