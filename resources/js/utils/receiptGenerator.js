import { showNotification } from '@/utils/notification';

export const generateReceipt = (currentOrder, availableShopAttributes = []) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification?.warning('Unable to open print window. Please allow pop-ups and try again.');
        return;
    }

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const shopName = currentOrder.tailoring_shop?.shop_name || currentOrder.tailoringShop?.shop_name || 'Stitch Central';
    const customerName = currentOrder.user?.name || currentOrder.customer?.name || 'Customer';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate Math
    const amountPaid = Number(currentOrder.amount_paid || 0);
    const grandTotal = Number(currentOrder.total_amount || currentOrder.total_price || 0);
    const remainingBalance = Math.max(0, grandTotal - amountPaid);
    const rushFee = Number(currentOrder.rush_fee || 0);
    
    const initialItemsTotal = (currentOrder.items || [])
        .filter(item => Number(item.price || item.pivot?.price) > 0)
        .reduce((total, item) => total + (Number(item.price || item.pivot?.price || 0) * Number(item.quantity || item.pivot?.quantity || 1)), 0);
        
    const addedMaterialsTotal = (currentOrder.required_materials || [])
        .reduce((total, req) => total + (Number(req.price || 0) * Number(req.quantity || 1)), 0);
        
    const materialsTotal = initialItemsTotal + addedMaterialsTotal;
    const baseLabor = Number(currentOrder.labor_price || 0) || (grandTotal > 0 ? Math.max(0, grandTotal - materialsTotal - rushFee) : Number(currentOrder.orderServices?.[0]?.price || 0));

    // Determine Payment Method
    const manualRef = currentOrder?.manual_payment_reference_id || '';
    let paymentMethodDisplay = 'Pending Selection';
    if (manualRef === 'CASH-INTENT') paymentMethodDisplay = 'Cash (In-Shop)';
    else if (currentOrder.paymongo_payment_id) paymentMethodDisplay = 'Online (PayMongo)';
    else if (manualRef) paymentMethodDisplay = 'Manual Transfer';

    const paymentStatusRaw = (currentOrder.payment?.status?.name || currentOrder.payment_status || currentOrder.payment?.payment_status || '').toString().trim();
    const docTitle = remainingBalance <= 0 ? 'OFFICIAL RECEIPT' : 'BILLING INVOICE';

    // Generate HTML for Customer Items
    const customerItemsHtml = (currentOrder.items || [])
        .filter(item => Number(item.price || item.pivot?.price) > 0)
        .map(item => {
            const qty = Number(item.quantity || item.pivot?.quantity || 1);
            const unitPrice = Number(item.price || item.pivot?.price || 0);
            const lineTotal = qty * unitPrice;
            const shopAttrId = item.pivot?.shop_attribute_id || item.shop_attribute_id || item.id;
            const catalogItem = availableShopAttributes?.find(a => a.pivot?.id === shopAttrId || a.id === shopAttrId);
            
            let displayName = catalogItem?.pivot?.item_name || catalogItem?.item_name || item.shopAttribute?.item_name || catalogItem?.name || item.shopAttribute?.attribute?.name || 'Shop Add-on';
            if (displayName.includes(' - ')) displayName = displayName.split(' - ')[0].trim();

            return `
                <tr>
                    <td style="padding-left: 20px;">
                        ${escapeHtml(displayName)} 
                        <br><span style="font-size: 11px; color: #6b7280;">Qty: ${qty} &times; ₱${unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="amount">₱${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
            `;
        }).join('');

    // Generate HTML for Tailor Materials
    const tailorMaterialsHtml = (currentOrder.required_materials || [])
        .filter(req => Number(req.price) > 0)
        .map(req => {
            const qty = Number(req.quantity || 1);
            const unitPrice = Number(req.price || 0);
            const lineTotal = qty * unitPrice;
            const displayName = req.material_name || req.name || 'Added Material';
            
            return `
                <tr>
                    <td style="padding-left: 20px;">
                        ${escapeHtml(displayName)} 
                        <br><span style="font-size: 11px; color: #6b7280;">Qty: ${qty} &times; ₱${unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="amount">₱${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
            `;
        }).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${docTitle} - Order #${currentOrder.id}</title>
            <style>
                @media print {
                    @page { margin: 0.5in; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; color: #1f2937; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 30px; margin-bottom: 30px; }
                .shop-info h1 { margin: 0; color: #10b981; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
                .shop-info p { margin: 5px 0 0 0; color: #6b7280; font-size: 13px; font-weight: 500; }
                .receipt-title { text-align: right; }
                .receipt-title h2 { margin: 0; font-size: 24px; color: #1f2937; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
                .receipt-title p { margin: 8px 0 0 0; font-weight: 600; color: #9ca3af; font-size: 14px; }
                .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
                .meta-col strong { display: block; font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700; }
                .meta-col span { font-size: 15px; font-weight: 600; color: #374151; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f3f4f6; padding: 14px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4b5563; border-bottom: 2px solid #d1d5db; font-weight: 700; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; }
                td.amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
                th.amount { text-align: right; }
                .category-row td { font-size: 11px; font-weight: 800; color: #6b7280; background: #f9fafb; padding: 8px 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; }
                .totals { width: 50%; margin-left: 50%; margin-bottom: 40px; }
                .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
                .totals-row.grand { font-size: 18px; font-weight: 900; padding-top: 12px; border-top: 2px solid #1f2937; border-bottom: none; margin-top: 8px; }
                .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="shop-info">
                    <h1>${escapeHtml(shopName)}</h1>
                    <p>Official Digital Record</p>
                </div>
                <div class="receipt-title">
                    <h2>${docTitle}</h2>
                    <p>Order #${escapeHtml(currentOrder.id)}</p>
                </div>
            </div>

            <div class="meta-grid">
                <div class="meta-col">
                    <strong>Billed To</strong>
                    <span>${escapeHtml(customerName)}</span>
                </div>
                <div class="meta-col">
                    <strong>Date Issued</strong>
                    <span>${escapeHtml(dateStr)}</span>
                </div>
                <div class="meta-col">
                    <strong>Payment Method</strong>
                    <span>${escapeHtml(paymentMethodDisplay)}</span>
                </div>
                <div class="meta-col">
                    <strong>Status</strong>
                    <span style="color: ${remainingBalance <= 0 ? '#10b981' : '#f59e0b'};">${escapeHtml(paymentStatusRaw || 'Pending')}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Base Labor & Service Fee</strong></td>
                        <td class="amount">₱${baseLabor.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                    
                    ${customerItemsHtml ? `
                        <tr class="category-row"><td colspan="2">Customer Selected Add-ons</td></tr>
                        ${customerItemsHtml}
                    ` : ''}
                    
                    ${tailorMaterialsHtml ? `
                        <tr class="category-row"><td colspan="2">Shop Added Materials</td></tr>
                        ${tailorMaterialsHtml}
                    ` : ''}
                    
                    ${rushFee > 0 ? `
                    <tr>
                        <td><strong>Rush Order Surcharge</strong></td>
                        <td class="amount">₱${rushFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>` : ''}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal</span>
                    <span>₱${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="totals-row">
                    <span>Amount Paid</span>
                    <span>₱${amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="totals-row grand">
                    <span>Balance Due</span>
                    <span style="color: ${remainingBalance > 0 ? '#ef4444' : '#10b981'};">₱${remainingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for choosing ${escapeHtml(shopName)}.</p>
                <p>Powered by Stitch Central Digital Platform</p>
            </div>
            <script>
                window.onload = function() { setTimeout(function() { window.print(); }, 500); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
