<?php

namespace Database\Seeders;

use App\Models\ShopSchedule;
use App\Models\TailoringShop;
use Illuminate\Database\Seeder;

class ShopScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default shop hours: Monday-Saturday 8 AM - 5 PM, Closed Sunday
        $defaultSchedules = [
            ['day_of_week' => 0, 'is_open' => false, 'open_time' => null, 'close_time' => null], // Sunday
            ['day_of_week' => 1, 'is_open' => true, 'open_time' => '08:00', 'close_time' => '17:00'], // Monday
            ['day_of_week' => 2, 'is_open' => true, 'open_time' => '08:00', 'close_time' => '17:00'], // Tuesday
            ['day_of_week' => 3, 'is_open' => true, 'open_time' => '08:00', 'close_time' => '17:00'], // Wednesday
            ['day_of_week' => 4, 'is_open' => true, 'open_time' => '08:00', 'close_time' => '17:00'], // Thursday
            ['day_of_week' => 5, 'is_open' => true, 'open_time' => '08:00', 'close_time' => '17:00'], // Friday
            ['day_of_week' => 6, 'is_open' => true, 'open_time' => '09:00', 'close_time' => '15:00'], // Saturday
        ];

        // Get all shops
        $shops = TailoringShop::all();

        foreach ($shops as $shop) {
            // Delete existing schedules to ensure clean state
            $shop->schedules()->delete();

            // Create default schedules for this shop
            foreach ($defaultSchedules as $schedule) {
                ShopSchedule::create([
                    'shop_id' => $shop->id,
                    'day_of_week' => $schedule['day_of_week'],
                    'is_open' => $schedule['is_open'],
                    'open_time' => $schedule['open_time'],
                    'close_time' => $schedule['close_time'],
                ]);
            }
        }
    }
}
