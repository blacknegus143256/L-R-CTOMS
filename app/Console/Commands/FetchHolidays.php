<?php

namespace App\Console\Commands;

use App\Models\Holiday;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class FetchHolidays extends Command
{
    protected $signature = 'app:fetch-holidays';

    protected $description = 'Fetch Philippine public holidays for current and next year from Nager.Date and sync them locally.';

    public function handle(): int
    {
        $baseUrl = 'https://date.nager.at/api/v3/PublicHolidays';
        $currentYear = now()->year;
        $nextYear = $currentYear + 1;

        $currentYearResponse = Http::timeout(20)->get("{$baseUrl}/{$currentYear}/PH");
        if (! $currentYearResponse->successful()) {
            $this->error("Failed to fetch holidays for {$currentYear}. HTTP status: {$currentYearResponse->status()}");

            return self::FAILURE;
        }

        $currentYearHolidays = $currentYearResponse->json();
        if (empty($currentYearHolidays)) {
            $this->warn("No holiday data returned for {$currentYear}.");

            return self::FAILURE;
        }

        $nextYearResponse = Http::timeout(20)->get("{$baseUrl}/{$nextYear}/PH");
        if (! $nextYearResponse->successful()) {
            $this->error("Failed to fetch holidays for {$nextYear}. HTTP status: {$nextYearResponse->status()}");

            return self::FAILURE;
        }

        $nextYearHolidays = $nextYearResponse->json();
        if (empty($nextYearHolidays)) {
            $this->warn("No holiday data returned for {$nextYear}.");

            return self::FAILURE;
        }

        $holidays = array_merge($currentYearHolidays, $nextYearHolidays);
        if (empty($holidays)) {
            $this->warn('No holiday data available after merging API responses.');

            return self::FAILURE;
        }

        $syncedCount = 0;

        foreach ($holidays as $holiday) {
            if (empty($holiday['date']) || empty($holiday['localName'])) {
                continue;
            }

            Holiday::updateOrCreate(
                ['date' => $holiday['date']],
                [
                    'name' => $holiday['localName'],
                    'is_national' => true,
                ]
            );

            $syncedCount++;
        }

        $this->info("Successfully synced {$syncedCount} holidays.");

        return self::SUCCESS;
    }
}