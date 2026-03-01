<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AttributeCategory;

class AttributeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'fabric' => [
                'name' => 'Fabric',
                'types' => [
                    'Cotton',
                    'Polyester',
                    'Silk',
                    'Linen',
                    'Wool',
                    'Denim',
                    'Knit / Stretch',
                    'Lace',
                    'Satin / Shiny',
                    'Uniform Fabric',
                    'Mixed / Blend',
                    'Others'
                ],
            ],

            'thread' => [
                'name' => 'Thread',
                'types' => [
                    'Polyester Thread',
                    'Cotton Thread',
                    'Silk Thread',
                    'Embroidery Thread',
                    'Heavy-Duty Thread'
                ],
            ],

            'fasteners' => [
                'name' => 'Fasteners',
                'types' => [
                    'Buttons',
                    'Zippers',
                    'Hooks & Eyes',
                    'Snaps',
                    'Velcro',
                    'Buckles'
                ],
            ],

            'elastic' => [
                'name' => 'Elastic',
                'types' => [
                    'Flat Elastic',
                    'Round Elastic',
                    'Buttonhole Elastic',
                    'Clear Elastic',
                    'Waistband Elastic'
                ],
            ],

            'trims' => [
                'name' => 'Trims',
                'types' => [
                    'Lace Trim',
                    'Ribbon',
                    'Sequined Trim',
                    'Beaded Trim',
                    'Appliqué',
                    'Fringe'
                ],
            ],

            'support' => [
                'name' => 'Support Materials',
                'types' => [
                    'Interfacing',
                    'Boning',
                    'Shoulder Pads',
                    'Bra Cups',
                    'Collar Stays'
                ],
            ],
        ];

        foreach ($categories as $slug => $data) {
            // Create category
            $category = AttributeCategory::firstOrCreate(
                ['slug' => $slug],
                ['name' => $data['name']]
            );

            // Create types under category
            foreach ($data['types'] as $typeName) {
                $category->attributeTypes()->firstOrCreate([
                    'name' => $typeName
                ]);
            }
        }
    }
}