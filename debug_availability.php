<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$shop = \App\Models\TailoringShop::with(['schedules', 'exceptions'])->first();
if (!$shop) {
    die("No shop found\n");
}

$controller = new \App\Http\Controllers\Api\AvailabilityController();
$request = new \Illuminate\Http\Request();
$request->merge(['month' => 5, 'year' => 2026]);

$response = $controller->getMonthlyAvailability($request, $shop);
$data = json_decode($response->getContent(), true);

$sampleDate = null;
foreach ($data as $date => $dayData) {
    if (!empty($dayData['slots'])) {
        $sampleDate = $date;
        break;
    }
}

echo "Shop: {$shop->shop_name}\n";
echo "slot_duration_minutes: {$shop->slot_duration_minutes}\n";
echo "max_bookings_per_slot: {$shop->max_bookings_per_slot}\n";
echo "max_user_bookings_per_slot: {$shop->max_user_bookings_per_slot}\n";
echo "Schedules: {$shop->schedules->count()}\n";
echo "Exceptions: {$shop->exceptions->count()}\n\n";

if (!$sampleDate) {
    echo "No available dates found in sample month.\n";
    exit;
}

echo "Sample available date: {$sampleDate}\n";
$slots = $data[$sampleDate]['slots'];
foreach (array_slice($slots, 0, 5) as $slot) {
    echo json_encode($slot, JSON_UNESCAPED_SLASHES) . "\n";
}
