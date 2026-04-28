<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\ShopSchedule;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function submitManualPayment(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id && $order->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'reference_id' => ['required', 'string'],
            'payment_proof' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
            'payment_type' => ['nullable', 'in:full,partial'],
        ]);

        $proofPath = $request->file('payment_proof')->store('payment_proofs', 'public');

        if ($order->manual_payment_proof_path && Storage::disk('public')->exists($order->manual_payment_proof_path)) {
            Storage::disk('public')->delete($order->manual_payment_proof_path);
        }

        $order->update([
            'payment_type' => $validated['payment_type'] ?? $order->payment_type,
            'manual_payment_reference_id' => $validated['reference_id'],
            'manual_payment_proof_path' => $proofPath,
            'payment_status' => 'Pending',
            'total_amount' => (float) ($order->total_amount ?: $order->total_price),
            'amount_paid' => 0,
        ]);

        $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
            $order,
            'Customer submitted manual payment proof for Order #' . $order->id . '. Please verify the transfer reference and screenshot.',
            'payment_received'
        ));

        return response()->json([
            'success' => true,
            'message' => 'Payment proof submitted successfully. The shop will verify your transfer shortly.',
        ]);
    }

    /**
     * Generate a PayMongo payment link for an order.
     * 
     * POST /api/payments/generate
     * 
     * @param Request $request - Must contain: order_id, payment_type ('full' or 'partial')
     * @return \Illuminate\Http\JsonResponse
     */
    public function generatePaymentLink(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_type' => 'required|in:full,partial',
        ]);

        $order = Order::findOrFail($request->order_id);

        // Verify order belongs to authenticated user
        if ($order->user_id !== $request->user()->id && $order->customer_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Use the tailor quote amount as the payment source of truth.
        $basePrice = (float) $order->total_price;

        if ($basePrice <= 0) {
            return response()->json(['message' => 'Order total amount not set or invalid'], 400);
        }

        // Keep legacy payment tracking column in sync for downstream logic.
        $order->update(['total_amount' => $basePrice]);

        // Compute charge based on selected payment type.
        $chargeAmount = $request->payment_type === 'partial' ? ($basePrice / 2) : $basePrice;

        if ($chargeAmount < 20) {
            return response()->json(['message' => 'Payment amount must be at least ₱20.00 to use PayMongo.'], 400);
        }

        // Convert to cents for PayMongo
        $amountInCents = (int) round($chargeAmount * 100);

        try {
            // Call PayMongo API to create a payment link
            $response = Http::withBasicAuth(config('services.paymongo.secret_key'), '')
                ->post('https://api.paymongo.com/v1/links', [
                    'data' => [
                        'attributes' => [
                            'amount' => $amountInCents,
                            'currency' => 'PHP',
                            'description' => 'Payment for Order #' . $order->id . ' at ' . $order->tailoringShop->shop_name,
                            'remarks' => "Order ID: {$order->id}",
                            'success_url' => url('/my-orders/' . $order->id),
                        ],
                    ],
                ]);
            if (!$response->successful()) {
                Log::error('PayMongo link creation failed', [
                    'order_id' => $order->id,
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);

                return response()->json(['error' => 'Failed to create payment link'], 500);
            }

            $data = $response->json()['data'];
            $paymongoLinkId = $data['id'];
            $checkoutUrl = $data['attributes']['checkout_url'];

            // Save payment metadata to order
            $order->update([
                'payment_type' => $request->payment_type,
                'paymongo_link_id' => $paymongoLinkId,
            ]);

            return response()->json([
                'checkout_url' => $checkoutUrl,
                'paymongo_link_id' => $paymongoLinkId,
                'amount' => $chargeAmount,
                'payment_type' => $request->payment_type,
            ]);
        } catch (\Exception $e) {
            Log::error('PayMongo payment link error', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Payment service error'], 500);
        }
    }

    /**
     * Handle PayMongo webhook for payment completion.
     * 
     * POST /payments/webhook
     */
    public function webhook(Request $request)
    {
        $event = $request->input('data.type');
        
        // Process paid events from PayMongo payload variants.
        if (!in_array($event, ['link.payment.paid', 'payment.paid'], true)) {
            return response()->json(['ok' => true]);
        }

        try {
            $paymentData = $request->input('data.attributes');
            $link = $request->input('data.relationships.link.data');
            $linkId = $link['id'] ?? null;

            // Resolve order using reference data first, then fallback to link id.
            $order = $this->resolveOrderFromWebhook($request, $linkId);

            if (!$order) {
                Log::warning('PayMongo webhook could not resolve order', ['payload' => $request->all()]);
                return response()->json(['error' => 'Order reference not found'], 404);
            }

            // Extract payment amount from webhook (in cents)
            $amountPaidInCents = $paymentData['amount'] ?? 0;
            $amountPaid = $amountPaidInCents / 100;

            // Extract PayMongo payment ID for receipt verification
            $payment = $request->input('data.relationships.payment.data');
            $paymongoPaymentId = $payment['id'] ?? null;

            // Idempotency guard for retried webhooks.
            if ($paymongoPaymentId && $order->paymongo_payment_id === $paymongoPaymentId) {
                return response()->json(['ok' => true]);
            }

            $updatedAmountPaid = (float) $order->amount_paid + (float) $amountPaid;
            $totalAmount = (float) ($order->total_amount ?: $order->total_price);
            $paymentStatus = $updatedAmountPaid + 0.01 >= $totalAmount ? 'Paid' : 'Partial';

            // Update order with payment info and confirm order status
            $order->update([
                'amount_paid' => $updatedAmountPaid,
                'paymongo_payment_id' => $paymongoPaymentId,
                'payment_status' => $paymentStatus,
                'status' => \App\Enums\OrderStatus::CONFIRMED->value,
            ]);

            // Reload to get fresh data
            $order->refresh();

            // Notify the shop owner that payment is verified.
            $amount = (float) $amountPaid;
            $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
                $order,
                'Success! The customer has secured ₱' . number_format($amount, 2) . ' in Escrow for Order #' . $order->id . '. The funds are locked and will be disbursed upon completion.',
                'payment_received'
            ));

            // Check if order is ready for production (now that payment is updated)
            $this->checkReadyForProduction($order);

            Log::info('PayMongo payment processed', [
                'order_id' => $order->id,
                'amount_paid' => $amountPaid,
                'payment_status' => $order->payment_status,
            ]);

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            Log::error('PayMongo webhook error', [
                'message' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Backward-compatible alias for existing route references.
     */
    public function handleWebhook(Request $request)
    {
        return $this->webhook($request);
    }

    private function resolveOrderFromWebhook(Request $request, ?string $linkId): ?Order
    {
        $referenceId = $request->input('data.attributes.reference_number')
            ?? $request->input('data.attributes.external_reference_number')
            ?? $request->input('data.attributes.remarks');

        if (is_string($referenceId) && preg_match('/(\d+)/', $referenceId, $matches) === 1) {
            $resolved = Order::find((int) $matches[1]);
            if ($resolved) {
                return $resolved;
            }
        }

        if ($linkId) {
            return Order::where('paymongo_link_id', $linkId)->first();
        }

        return null;
    }

    /**
     * Check if order is ready for production (from checkReadyForProduction logic).
     * This method is called after payment webhook processing.
     * 
     * @param Order $order
     */
    private function checkReadyForProduction(Order $order): void
    {
        $currentStatus = $order->status instanceof \App\Enums\OrderStatus
            ? $order->status->value
            : (string) $order->status;

        if ($currentStatus !== 'Confirmed') {
            return;
        }

        $needsMaterials = $order->material_source === 'customer';
        $needsMeasurements = Order::requiresInShopMeasurements($order->measurement_type);

        $logisticsMet = (! $needsMaterials || $order->materials_received)
            && (! $needsMeasurements || $order->measurements_taken);

        // Production unlocks if logistics met AND payment is 'Partial' OR 'Paid'
        $paymentMet = in_array($order->payment_status, ['Partial', 'Paid'], true);

        if ($logisticsMet && $paymentMet) {
            $order->update(['status' => 'Ready for Production']);
            $order->loadMissing(['user', 'tailoringShop', 'customer']);

            $order->user?->notify(new OrderUpdatedNotification(
                $order,
                'Your order is verified and ready for production.',
                'ready_for_production'
            ));
        }
    }

    /**
     * Manually verify payment status from PayMongo API.
     * 
     * This is a fallback mechanism when webhooks are blocked (localhost/development).
     * Fetches the link status from PayMongo and syncs the order payment state.
     * 
     * POST /orders/{order}/verify-payment
     * 
     * @param Order $order
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPayment(Request $request, Order $order)
    {
        if ($order->tailoringShop?->user_id !== $request->user()?->id) {
            abort(403, 'Unauthorized.');
        }

        $hasManualProof = !empty($order->manual_payment_proof_path);

        if ($hasManualProof && (string) $order->payment_status === 'Pending') {
            $validated = $request->validate([
                'status' => ['nullable', Rule::in(['Partial', 'Paid'])],
            ]);

            $totalAmount = (float) ($order->total_amount ?: $order->total_price);
            $paymentStatus = $validated['status'] ?? ($order->payment_type === 'partial' ? 'Partial' : 'Paid');
            $amountPaid = $paymentStatus === 'Partial' ? ($totalAmount / 2) : $totalAmount;

            $order->update([
                'amount_paid' => $amountPaid,
                'payment_status' => $paymentStatus,
                'status' => OrderStatus::CONFIRMED->value,
            ]);

            $order->refresh();

            $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
                $order,
                'Manual payment proof approved for Order #' . $order->id . '. The funds are now marked as ' . $paymentStatus . '.',
                'payment_received'
            ));

            $this->checkReadyForProduction($order);

            return redirect()->back()->with('success', 'Manual payment approved successfully.');
        }

        // Check if order has a PayMongo link ID
        if (!$order->paymongo_link_id) {
            return redirect()->back()->with('error', 'Payment link is still unpaid or an error occurred.');
        }

        try {
            // Fetch link status from PayMongo API
            $response = Http::withBasicAuth(config('services.paymongo.secret_key'), '')
                ->get("https://api.paymongo.com/v1/links/{$order->paymongo_link_id}");

            if (!$response->successful()) {
                Log::error('PayMongo link status fetch failed', [
                    'order_id' => $order->id,
                    'link_id' => $order->paymongo_link_id,
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);

                return redirect()->back()->with('error', 'Payment link is still unpaid or an error occurred.');
            }

            $linkData = $response->json()['data'];
            $linkStatus = $linkData['attributes']['status'] ?? null;
            $linkAmount = $linkData['attributes']['amount'] ?? 0; // in cents

            // If link is not yet paid, return current status
            if ($linkStatus !== 'paid') {
                return redirect()->back()->with('error', 'Payment link is still unpaid or an error occurred.');
            }

            // Convert amount from cents to pesos
            $amountPaid = $linkAmount / 100;

            // Determine payment status based on payment type
            $paymentStatus = $order->payment_type === 'full' ? 'Paid' : 'Partial';

            // Update order with payment information and confirm order status
            $order->update([
                'amount_paid' => $amountPaid,
                'payment_status' => $paymentStatus,
                'status' => \App\Enums\OrderStatus::CONFIRMED->value,
            ]);

            // Reload to get fresh data
            $order->refresh();

            // Notify the shop owner of verified payment
            $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
                $order,
                'Success! The customer has secured ₱' . number_format($amountPaid, 2) . ' in Escrow for Order #' . $order->id . '. The funds are locked and will be disbursed upon completion.',
                'payment_received'
            ));

            // Check if order is ready for production
            $this->checkReadyForProduction($order);

            Log::info('Manual payment verification completed', [
                'order_id' => $order->id,
                'amount_paid' => $amountPaid,
                'payment_status' => $paymentStatus,
            ]);

            return redirect()->back()->with('success', 'Payment verified successfully. Escrow updated.');
        } catch (\Exception $e) {
            Log::error('Manual payment verification error', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Payment link is still unpaid or an error occurred.');
        }
    }

    public function rejectPayment(Request $request, Order $order)
    {
        if ($order->tailoringShop?->user_id !== $request->user()?->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string'],
        ]);

        if ((string) $order->payment_status !== 'Pending' || empty($order->manual_payment_proof_path)) {
            return redirect()->back()->with('error', 'No pending manual payment proof to reject.');
        }

        $order->update([
            'payment_status' => 'Pending',
            'amount_paid' => 0,
            'manual_payment_reference_id' => null,
            'manual_payment_proof_path' => null,
            'notes' => 'PAYMENT_REJECTED: ' . $validated['reason'] . "\n\n" . ($order->notes ?? ''),
        ]);

        $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
            $order,
            'Manual payment proof was rejected for Order #' . $order->id . '. Please ask the customer to resubmit a clearer screenshot or valid transfer.',
            'payment_received'
        ));

        return redirect()->back()->with('success', 'Manual payment proof rejected.');
    }

    public function recordCashPayment(Order $order, Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $amountPaid = (float) $validated['amount'];
        $totalAmount = (float) ($order->total_amount ?: $order->total_price);
        $paymentStatus = $amountPaid + 0.01 >= $totalAmount ? 'Paid' : 'Partial';

        $order->update([
            'amount_paid' => $amountPaid,
            'payment_status' => $paymentStatus,
            'payment_type' => 'cash',
            'status' => OrderStatus::CONFIRMED->value,
        ]);

        $order->refresh();

        $order->tailoringShop?->user?->notify(new OrderUpdatedNotification(
            $order,
            'Cash payment of ₱' . number_format($amountPaid, 2) . ' was recorded for Order #' . $order->id . '.',
            'payment_received'
        ));

        if (method_exists($this, 'checkReadyForProduction')) {
            $this->checkReadyForProduction($order);
        }

        return redirect()->back()->with('success', 'Cash payment recorded successfully.');
    }

    public function settleRemainingBalance(Order $order)
    {
        if ((string) $order->payment_status !== 'Partial') {
            return redirect()->back()->with('error', 'Only partially paid orders can be settled.');
        }

        $order->update([
            'payment_status' => 'Paid',
            'amount_paid' => (float) $order->total_price,
        ]);

        return redirect()->back()->with('success', 'Remaining balance collected successfully.');
    }
}
