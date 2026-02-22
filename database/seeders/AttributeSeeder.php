<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeCategory;
use App\Models\TailoringShop;
use Illuminate\Database\Seeder;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $fabrics = AttributeCategory::firstOrCreate(
            ['slug' => 'fabrics'],
            ['name' => 'Fabrics']
        );
        $silk = $fabrics->attributes()->firstOrCreate(['name' => 'Silk'], []);
        $cotton = $fabrics->attributes()->firstOrCreate(['name' => 'Cotton'], []);
        $linen = $fabrics->attributes()->firstOrCreate(['name' => 'Linen'], []);

        $notions = AttributeCategory::firstOrCreate(
            ['slug' => 'notions'],
            ['name' => 'Notions']
        );
        $zipper = $notions->attributes()->firstOrCreate(['name' => 'YKK Zipper'], []);
        $button = $notions->attributes()->firstOrCreate(['name' => 'Gold Button'], []);

        $shops = TailoringShop::where('status', 'approved')->take(2)->orderBy('id')->get();
        if ($shops->count() < 2) {
            return;
        }

        $shop1 = $shops[0];
        $shop2 = $shops[1];

        $shop1->attributes()->syncWithoutDetaching([
            $silk->id => ['price' => 450, 'unit' => 'per yard', 'notes' => null],
            $cotton->id => ['price' => 180, 'unit' => 'per yard', 'notes' => null],
            $zipper->id => ['price' => 80, 'unit' => 'per piece', 'notes' => null],
            $button->id => ['price' => 25, 'unit' => 'per piece', 'notes' => null],
        ]);
        $shop2->attributes()->syncWithoutDetaching([
            $silk->id => ['price' => 500, 'unit' => 'per yard', 'notes' => 'Imported'],
            $linen->id => ['price' => 220, 'unit' => 'per yard', 'notes' => null],
            $zipper->id => ['price' => 75, 'unit' => 'per piece', 'notes' => null],
            $button->id => ['price' => 30, 'unit' => 'per piece', 'notes' => null],
        ]);
    }
}
