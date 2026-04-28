<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Holiday;
use App\Models\ShopException;
use App\Models\ShopSchedule;
use App\Models\TailoringShop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class SchedulingDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $shopOwner = User::updateOrCreate(
            ['email' => 'schedule-shop-owner@example.com'],
            [
                'name' => 'Scheduling Shop Owner',
                'password' => Hash::make('password'),
                'role' => 'store_admin',
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'schedule-customer@example.com'],
            [
                'name' => 'Scheduling Customer',
                'password' => Hash::make('password'),
                'role' => 'customer',
            ]
        );

        $shop = TailoringShop::updateOrCreate(
            ['user_id' => $shopOwner->id, 'shop_name' => 'Scheduling Demo Shop'],
            [
                'slug' => 'scheduling-demo-shop',
                'description' => 'Demo shop used for scheduling seed data.',
                'contact_person' => 'Scheduling Owner',
                'contact_role' => 'Owner',
                'is_active' => true,
                'status' => 'approved',
                'slot_duration_minutes' => 30,
                'max_bookings_per_slot' => 3,
            ]
        );

        foreach ([
            0 => [false, null, null],
            1 => [true, '09:00:00', '17:00:00'],
            2 => [true, '09:00:00', '17:00:00'],
            3 => [true, '09:00:00', '17:00:00'],
            4 => [true, '09:00:00', '17:00:00'],
            5 => [true, '09:00:00', '17:00:00'],
            6 => [true, '09:00:00', '17:00:00'],
        ] as $dayOfWeek => [$isOpen, $openTime, $closeTime]) {
            ShopSchedule::updateOrCreate(
                ['shop_id' => $shop->id, 'day_of_week' => $dayOfWeek],
                [
                    'is_open' => $isOpen,
                    'open_time' => $openTime,
                    'close_time' => $closeTime,
                ]
            );
        }

        Holiday::updateOrCreate(
            ['date' => '2026-12-25'],
            ['name' => 'Christmas Day', 'is_national' => true]
        );

        Holiday::updateOrCreate(
            ['date' => '2026-12-30'],
            ['name' => 'Rizal Day', 'is_national' => true]
        );

        $exceptionDate = Carbon::parse('2026-12-24')->toDateString();

        ShopException::updateOrCreate(
            ['shop_id' => $shop->id, 'date' => $exceptionDate],
            [
                'is_closed' => false,
                'open_time' => '09:00:00',
                'close_time' => '12:00:00',
                'reason' => 'Holiday short day',
            ]
        );

        Appointment::updateOrCreate(
            [
                'shop_id' => $shop->id,
                'user_id' => $customer->id,
                'date' => '2026-12-26',
                'time_start' => '10:00:00',
            ],
            [
                'time_end' => '11:00:00',
                'status' => 'confirmed',
            ]
        );
    }
}