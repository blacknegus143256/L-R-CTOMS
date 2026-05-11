import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Camera, ClipboardList, MapPin, Printer } from 'lucide-react';
import { showNotification } from '@/utils/notification';
import { generateReceipt } from '@/utils/receiptGenerator';

const formatAppointment = (appointment) => {
    if (!appointment || !appointment.date) return 'TBD';
    
    const dateObj = new Date(appointment.date);
    if (Number.isNaN(dateObj.getTime())) return 'TBD';
    
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (!appointment.time_start) return dateStr;
    
    // Format "13:30:00" to "1:30 PM"
    const [hours, minutes] = appointment.time_start.split(':');
    const timeObj = new Date();
    timeObj.setHours(hours, minutes);
    const timeStr = timeObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    
    return `${dateStr} at ${timeStr}`;
};

const formatExpectedCompletion = (order) => {
    const expected = order?.expected_completion_date;
    const started = order?.production_started_at;
    const minDays = Number(order?.production_min_days || 0);
    const maxDays = Number(order?.production_max_days || 0);

    const opts = { month: 'short', day: 'numeric', year: 'numeric' };

    if (!expected && !started) return 'TBD';

    if (started && minDays) {
        const startDate = new Date(started);
        if (Number.isNaN(startDate.getTime())) {
            return expected ? new Date(expected).toLocaleDateString(undefined, opts) : 'TBD';
        }

        const minDate = new Date(startDate);
        minDate.setDate(minDate.getDate() + minDays);
        const minStr = minDate.toLocaleDateString(undefined, opts);

        if (expected) {
            const maxStr = new Date(expected).toLocaleDateString(undefined, opts);
            const startedStr = startDate.toLocaleDateString(undefined, opts);
            return `${minStr} — ${maxStr} (est.) • started ${startedStr}`;
        }

        return `${minStr} (est.) • started ${startDate.toLocaleDateString(undefined, opts)}`;
    }

    if (expected) return new Date(expected).toLocaleDateString(undefined, opts);

    return 'TBD';
};

const TailorOverview = ({ 
    currentOrder, 
    tailorMaterials, 
    availableShopAttributes,
    shouldHighlightMeasurements = false,
    onAccept,
    onReject,
    setActiveTab,
    showRejectModal,
    rejectReasons,
    rejectData,
    setRejectData,
    handleReject,
    rejectProcessing,
    globalMeasurements = {}
}) => {
    const fitMethodName = currentOrder.fit_method?.name || currentOrder.fitMethod?.name || 'Unknown';
    const orderOwner = currentOrder.user || currentOrder.customer || {};
    const customerAddress = orderOwner.profile?.street
        ? `${orderOwner.profile.street}, ${orderOwner.profile.barangay || ''}`.replace(/,\s*$/, '')
        : 'No address provided';
    const isTailorMeasuredFlow = ['In-Shop Fitting', 'Home Visit'].includes(fitMethodName);
    const measurementsRef = useRef(null);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const [tailorInputs, setTailorInputs] = useState({});
    const [isSubmittingMeasurements, setIsSubmittingMeasurements] = useState(false);
    
    const orderMeasurements = currentOrder.order_measurements || [];
    const fittingAppointment = currentOrder.appointments?.find((a) => a.status === 'confirmed' && a.type === 'fitting');
    const dropoffAppointment = currentOrder.appointments?.find((a) => a.status === 'confirmed' && a.type === 'drop-off');
    const measurementDate = fittingAppointment?.date;
    const dropoffDate = dropoffAppointment?.date;
    const completedMeasurements = orderMeasurements.filter((measurement) => {
        const value = measurement?.measurement_value;
        return value !== null && value !== undefined && `${value}`.trim() !== '';
    });
    const pendingMeasurements = orderMeasurements.filter((measurement) => {
        const value = measurement?.measurement_value;
        return value === null || value === undefined || `${value}`.trim() === '';
    });

    const initialItemsTotal = (currentOrder.items || [])
        .filter(item => Number(item.price || item.pivot?.price) > 0)
        .reduce((total, item) => total + (Number(item.price || item.pivot?.price || 0) * Number(item.quantity || item.pivot?.quantity || 1)), 0);

    const addedMaterialsTotal = (currentOrder.required_materials || [])
        .reduce((total, req) => total + (Number(req.price || 0) * Number(req.quantity || 1)), 0);

    const materialsTotal = initialItemsTotal + addedMaterialsTotal;
    const grandTotal = Number(currentOrder.total_amount || currentOrder.total_price || 0);
    const rushFee = Number(currentOrder.rush_fee || 0);
    const baseLabor = Number(currentOrder.labor_price || 0) || (grandTotal > 0 ? Math.max(0, grandTotal - materialsTotal - rushFee) : Number(currentOrder.orderServices?.[0]?.price || 0));
    const amountPaid = Number(currentOrder.amount_paid || 0);
    const remainingBalance = Math.max(0, grandTotal - amountPaid);
    const paymentStatusRaw = (currentOrder.payment?.status?.name || currentOrder.payment_status || currentOrder.payment?.payment_status || '').toString().trim();

    const rawStatus = (currentOrder.status?.name || currentOrder.status || 'Requested').toString().trim().toLowerCase();
    const statusRank = {
        requested: 0,
        quoted: 1,
        confirmed: 2,
        'appointment scheduled': 3,
        'ready for production': 4,
        'in progress': 5,
        'in production': 5,
        'ready for pickup': 6,
        completed: 7,
    };
    const isAtLeastConfirmed = (statusRank[rawStatus] ?? 0) >= statusRank.confirmed;
    const isAtLeastQuoted = (statusRank[rawStatus] ?? 0) >= statusRank.quoted;

    useEffect(() => {
        if (shouldHighlightMeasurements && measurementsRef.current) {
            measurementsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [shouldHighlightMeasurements]);

    // Auto-fill tailor inputs from customer's global measurement profile
    useEffect(() => {
        const initialInputs = {};
        pendingMeasurements.forEach(m => {
            const globalValue = globalMeasurements[m.measurement_name]?.value || 
                              globalMeasurements[m.measurement_name];
            initialInputs[m.measurement_name] = globalValue || '';
        });
        setTailorInputs(initialInputs);
    }, [currentOrder?.id, globalMeasurements]);

    const markMaterialsReceived = () => {
        router.patch(route('store.orders.materials-received', currentOrder.id), {}, {
            preserveScroll: true,
        });
    };

    const handleViewMap = () => {
        const lat = orderOwner?.profile?.latitude;
        const lng = orderOwner?.profile?.longitude;

        if (lat && lng) {
            window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
            return;
        }

        showNotification?.warning('Customer location coordinates are missing.');
    };

    const getImageUrl = () => {
        if (!currentOrder.design_image) return '';
        return currentOrder.design_image.startsWith('http') ? currentOrder.design_image : `/storage/${currentOrder.design_image}`;
    };

    const handlePrintJobTicket = () => {
        setPrintLoading(true);
        const printWindow = window.open('', '_blank');
        const imageSrc = getImageUrl();

        let measurementsHtml = '<p style="font-style: italic; color: #666; text-align: center; padding: 10px;">No measurements recorded.</p>';
        if (orderMeasurements && orderMeasurements.length > 0) {
            measurementsHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #000; padding: 6px; text-transform: uppercase; font-size: 10px; text-align: left;">Part</th>
                            <th style="border: 1px solid #000; padding: 6px; text-transform: uppercase; font-size: 10px; text-align: left;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderMeasurements.map((measurement) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase;">${measurement.measurement_name || 'Unknown'}</td>
                                <td style="border: 1px solid #000; padding: 6px;">${measurement.measurement_value ? `${measurement.measurement_value} ${measurement.unit || ''}` : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        const deadlineText = formatExpectedCompletion(currentOrder);
        const serviceName = currentOrder.orderServices?.[0]?.service?.service_name || 'Custom Order';
        const customerName = currentOrder.user?.name || currentOrder.customer?.name || 'Customer';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Production Sheet - Order #${currentOrder.id}</title>
                <style>
                    @media print {
                        @page { margin: 0.4in; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.3; }
                    .header { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .header-left h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                    .header-left h2 { margin: 4px 0 8px 0; font-size: 18px; color: #333; }
                    .rush-badge { display: inline-block; background-color: #000; color: #fff; font-weight: bold; padding: 4px 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                    .header-right { text-align: right; font-size: 13px; }
                    .header-right strong { display: inline-block; width: 70px; text-align: left; text-transform: uppercase; font-size: 11px; color: #555; }
                    .visual-reference { margin-bottom: 15px; text-align: center; }
                    .visual-reference img { width: 100%; max-height: 400px; object-fit: contain; border: 2px solid #000; padding: 4px; box-sizing: border-box; }
                    .details-grid { display: flex; gap: 20px; }
                    .details-col { flex: 1; }
                    .section-title { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px; font-weight: bold; }
                    .notes-box { font-size: 14px; padding: 10px; border: 1px solid #000; margin-bottom: 15px; min-height: 60px; font-family: 'Courier New', Courier, monospace; }
                    .info-box { border: 1px solid #000; padding: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; background-color: #f9f9f9; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                    th { background-color: #f0f0f0; text-transform: uppercase; font-size: 10px; }
                    td:first-child { font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1>PRODUCTION SHEET</h1>
                        <h2>Order #${currentOrder.id}</h2>
                        ${currentOrder.is_rush || currentOrder.rush_order ? '<div class="rush-badge">RUSH ORDER</div>' : ''}
                    </div>
                    <div class="header-right">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">${customerName}</div>
                        <div><strong>Service:</strong> ${serviceName}</div>
                        <div><strong>Method:</strong> ${fitMethodName}</div>
                        <div><strong>Deadline:</strong> ${deadlineText}</div>
                    </div>
                </div>

                <div class="visual-reference">
                    ${imageSrc ? `<img src="${imageSrc}" onload="setTimeout(() => window.print(), 500)" />` : '<div style="height: 200px; border: 2px dashed #000; display:flex; align-items:center; justify-content:center; color:#666; font-style:italic;">No design image provided</div>'}
                </div>

                <div class="details-grid">
                    <div class="details-col">
                        <div class="section-title">Design Notes</div>
                        <div class="notes-box">${currentOrder.notes || 'No notes provided.'}</div>
                        <div class="info-box">
                            <span style="font-size:10px; color:#555;">Materials:</span><br/>
                            ${currentOrder.material_source === 'customer' ? 'Customer Provided' : 'Shop Provided'}
                        </div>
                    </div>

                    <div class="details-col">
                        <div class="section-title">Measurements / Dimensions</div>
                        ${measurementsHtml}
                    </div>
                </div>

                ${!imageSrc ? '<script>setTimeout(() => window.print(), 500);</script>' : ''}
            </body>
            </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
            setPrintLoading(false);
        }, 500);
    };

    

    const submitTailorMeasurements = () => {
        // Validate that all pending measurements have values
        const submitted = pendingMeasurements
            .filter(m => tailorInputs[m.measurement_name])
            .map(m => ({
                name: m.measurement_name,
                value: parseFloat(tailorInputs[m.measurement_name]) || 0,
                unit: m.unit || 'in',
            }));

        if (submitted.length === 0) {
            alert('Please enter measurements for all fields.');
            return;
        }

        setIsSubmittingMeasurements(true);
        router.patch(`/store/orders/${currentOrder.id}/save-measurements`, {
            measurements: submitted,
        }, {
            onSuccess: () => {
                setIsSubmittingMeasurements(false);
            },
            onError: () => {
                setIsSubmittingMeasurements(false);
            },
            preserveScroll: true,
        });
    };

    const markMeasurementsTaken = () => {
        router.patch(route('store.orders.measurements-taken', currentOrder.id), {}, {
            preserveScroll: true,
        });
    };

    const openGoogleMaps = (lat, lng) => {
        if (lat && lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
            return true;
        }

        return false;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Customer Request */}
            <div className="lg:col-span-2 space-y-8">
                <section className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 h-64 md:h-auto rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                        {getImageUrl() ? (
                            <img 
                                src={getImageUrl()}
                                alt="Design Reference" 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity duration-200" 
                                onClick={() => setIsImageExpanded(true)}
                                title="Click to expand and print job ticket"
                                style={{ userSelect: 'none' }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                                <Camera className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-xs font-medium uppercase tracking-wider">No Image Provided</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Requested Service</span>
                            <h3 className="text-xl font-black text-slate-800">{currentOrder.orderServices?.[0]?.service?.service_name || 'Custom Order'}</h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {currentOrder.orderServices?.[0]?.service?.serviceCategory?.name || 'Category'}
                            </span>
                        </div>
                        {currentOrder.style_tag && (
                            <div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Style Tag</span>
                                <span className="inline-block px-4 py-2 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-sm font-bold shadow-sm">
                                    {currentOrder.style_tag}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Customer Notes</span>
                            <p className="text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200 shadow-sm">
                                {currentOrder.notes || 'No additional notes provided.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Shop Items */}
                {currentOrder.items && currentOrder.items.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-100/50 mb-6">
                        <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Shop Items Availed</h3>
                        <ul className="space-y-3">
                            {currentOrder.items.map((item, idx) => {
                                // 1. Identify the core Shop Attribute ID
                                const shopAttrId = item.pivot?.shop_attribute_id || item.shop_attribute_id || item.id;

                                // 2. Cross-reference the live catalog to get the real names
                                const catalogItem = availableShopAttributes?.find(a => a.pivot?.id === shopAttrId || a.id === shopAttrId);

                                // 3. Extract the math
                                const qty = Number(item.quantity || item.pivot?.quantity || 1);
                                const unitPrice = Number(item.price || item.pivot?.price || catalogItem?.pivot?.price || catalogItem?.price || 0);
                                const totalPrice = qty * unitPrice;

                                // 4. Extract the display names, falling back to nested relationships if the catalog isn't loaded
                                let displayName = catalogItem?.pivot?.item_name || catalogItem?.item_name || item.shopAttribute?.item_name || catalogItem?.name || item.shopAttribute?.attribute?.name || 'Shop Item';
                                let categoryName = catalogItem?.attributeCategory?.name || catalogItem?.attribute_category?.name || item.shopAttribute?.attribute?.attributeCategory?.name || 'Add-on';
                                const unit = catalogItem?.pivot?.unit || catalogItem?.unit || item.unit || item.pivot?.unit || 'unit';

                                // 5. Clean up redundant names (e.g., "Custom Add-on - Custom Add-on")
                                if (displayName.includes(' - ')) {
                                    const parts = displayName.split(' - ');
                                    if (parts[0].trim() === parts[1].trim()) displayName = parts[0].trim();
                                }
                                if (displayName === categoryName) categoryName = 'Add-on';

                                return (
                                    <li key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm font-medium text-stone-700 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-150">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5 leading-none">
                                                {categoryName}
                                            </div>
                                            <div className="font-bold text-slate-900 text-base leading-tight truncate mb-1.5">
                                                {displayName}
                                            </div>
                                            <div className="text-xs font-semibold tracking-wider leading-relaxed">
                                                {unitPrice > 0 ? (
                                                    <span className="text-emerald-700">
                                                        ₱{unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})} per {unit}
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-500 font-bold">Included with Service</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:justify-end flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-stone-600 font-semibold uppercase tracking-wider">Qty:</span>
                                                <div className="bg-white border-2 border-emerald-300 text-emerald-900 px-3 py-1 rounded-lg font-black text-sm shadow-sm min-w-[50px] text-center">
                                                    {qty}
                                                </div>
                                            </div>

                                            {unitPrice > 0 && (
                                                <div className="flex items-center gap-2 border-l border-emerald-200 pl-4">
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest leading-none">Total</div>
                                                        <div className="font-black text-emerald-700 text-lg leading-tight mt-0.5">
                                                            ₱{totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {/* Required Materials Summary */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Required Materials</h3>
                    {tailorMaterials.length === 0 ? (
                        <p className="text-sm text-stone-500 italic">No materials specified yet. Please proceed to Quote tab to build the requirements.</p>
                    ) : (
                        <ul className="space-y-3">
                            {tailorMaterials.map((mat, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm font-medium text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                    <span className="font-bold text-slate-800">{mat.name || 'Unnamed Item'}</span>
                                    <span className="text-stone-500">{mat.quantity} {mat.unit}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Submitted Measurements */}
                    <div 
                        ref={measurementsRef}
                        className={`p-6 rounded-3xl mt-6 bg-white transition-all duration-1000 ${
                            shouldHighlightMeasurements 
                                ? 'border-indigo-400 ring-4 ring-indigo-100 shadow-lg shadow-indigo-100/50' 
                                : 'border border-stone-200 shadow-sm'
                        }`}
                    >
                        <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Customer Measurements</h3>
                        {orderMeasurements.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                {orderMeasurements.map((measure, idx) => {
                                    const isCompleted = !!measure.measurement_value;

                                    return (
                                        <div key={idx} className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition-colors ${
                                            isCompleted 
                                                ? 'bg-emerald-50 border-emerald-200' 
                                                : 'bg-amber-50 border-amber-200'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isCompleted ? 'text-emerald-600/70' : 'text-amber-600/70'}`}>
                                                {measure.measurement_name}
                                            </span>
                                            {isCompleted ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black text-emerald-900">
                                                        {measure.measurement_value} <span className="text-sm text-emerald-700 font-bold">{measure.unit}</span>
                                                    </span>
                                                    <span className="ml-auto text-emerald-500 text-sm font-bold bg-white px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                                        Done
                                                    </span>
                                                </div>
                                            ) : isTailorMeasuredFlow ? (
                                                <div className="space-y-2">
                                                    <input 
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Enter value"
                                                        value={tailorInputs[measure.measurement_name] || ''}
                                                        onChange={(e) => setTailorInputs(prev => ({...prev, [measure.measurement_name]: e.target.value}))}
                                                        disabled={isSubmittingMeasurements}
                                                        className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-900 placeholder-indigo-400 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <span className="text-xs text-indigo-600 font-medium">{measure.unit || 'in'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-amber-700">
                                                    Waiting on customer
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-stone-500 italic">
                                No measurements requested yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Logistics & Actions */}
            <div className="space-y-6">
                {/* Logistics */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 shadow-xl text-white">
                    <h3 className="text-sm font-black text-stone-300 uppercase tracking-widest mb-6">Order Logistics</h3>
                    <div className="space-y-4 text-sm font-medium">
                        <div className="border-b border-stone-700 pb-3 space-y-3">
                            <div className="flex justify-between items-baseline gap-4">
                                <span className="text-xs uppercase tracking-wider opacity-80">Materials</span>
                                <span className="font-bold text-emerald-400">
                                    {currentOrder.material_source === 'customer' ? 'Customer Provided' : 'Shop Provided'}
                                </span>
                            </div>
                            {currentOrder.material_source === 'customer' && !currentOrder.materials_received && (
                                <button
                                    type="button"
                                    onClick={markMaterialsReceived}
                                    className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-600"
                                >
                                    Mark Materials Received
                                </button>
                            )}
                        </div>
                        <div className="border-b border-stone-700 pb-3 space-y-3">
                            <div className="flex justify-between items-baseline gap-4">
                                <span className="text-xs uppercase tracking-wider opacity-80">Fit Method</span>
                                <span className="font-bold text-indigo-400">
                                    {fitMethodName}
                                </span>
                            </div>
                            {isTailorMeasuredFlow ? (
                                <div className="flex justify-between items-baseline gap-4 rounded-xl border border-stone-700/70 bg-stone-800/40 px-3 py-2">
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">Appointment</span>
                                    <span className="font-bold text-cyan-300">{measurementDate ? formatAppointment(fittingAppointment) : 'TBD'}</span>
                                </div>
                            ) : null}
                            {isTailorMeasuredFlow && !currentOrder.measurements_taken && (
                                <div className="group relative w-full">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => typeof setActiveTab === 'function' ? setActiveTab('measurements & quote') : null}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (typeof setActiveTab === 'function') setActiveTab('measurements & quote'); } }}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm cursor-pointer transition-colors hover:bg-indigo-50/70 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <ClipboardList className="h-4 w-4 shrink-0" />
                                        <span>Please enter measurements in the <br/>"Measurements & Quote" tab.</span>
                                    </div>
                                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                        Switch to the Measurements & Quote tab
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 p-4 rounded-xl border-2 transition-colors flex items-start gap-3 bg-white">
                            <MapPin className={`w-5 h-5 mt-0.5 ${fitMethodName === 'Home Visit' ? 'text-blue-600' : 'text-emerald-600'}`} />
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1">
                                    Meeting Location
                                </span>
                                {fitMethodName === 'Home Visit' ? (
                                    <>
                                        <p className="font-black text-blue-900 text-base">Customer's Location</p>
                                        <p className="text-sm text-slate-700 font-medium">{customerAddress}</p>
                                        <div className="mt-2 inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
                                            🚗 You must travel to the customer
                                        </div>
                                    </>
                                ) : fitMethodName === 'In-Shop Fitting' ? (
                                    <>
                                        <p className="font-black text-emerald-900 text-base">Your Shop</p>
                                        <p className="text-sm text-slate-700 font-medium">The customer will come to you.</p>
                                    </>
                                ) : (
                                    <p className="font-black text-stone-700 text-base">Remote (Self-Measured)</p>
                                )}
                                {fitMethodName === 'Home Visit' && (
                                    <button 
                                        type="button"
                                        onClick={handleViewMap}
                                        className="mt-4 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        View Customer Location on Map
                                    </button>
                                )}
                            </div>
                        </div>
                        {currentOrder.material_source === 'customer' && (
                            <div className="flex justify-between items-baseline border-b border-stone-700 pb-3 gap-4">
                                <span className="text-xs uppercase tracking-wider opacity-80">Drop-off Date</span>
                                <span className="font-bold text-emerald-400 text-right">
                                    {dropoffDate ? formatAppointment(dropoffAppointment) : 'TBD'}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline border-b border-stone-700 pb-3">
                            <span className="text-xs uppercase tracking-wider opacity-80">Rush Order</span>
                            <span className={`font-bold ${currentOrder.rush_order || currentOrder.is_rush ? 'text-rose-400' : 'text-stone-400'}`}>
                                {currentOrder.rush_order || currentOrder.is_rush ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pt-2">
                            <span className="text-[10px] uppercase tracking-wider opacity-80">Target Deadline</span>
                            <span className="text-lg font-black text-white">
                                {formatExpectedCompletion(currentOrder)}
                            </span>
                        </div>
                        {isAtLeastQuoted && (
                        <button
                            type="button"
                            onClick={() => generateReceipt(currentOrder, availableShopAttributes)}
                            className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-600 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                        )}
                    </div>
                </div>
                {/* Review Actions */}
                {(currentOrder.status?.name || currentOrder.status) === 'Requested' && (
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                        <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-2 text-center">Initial Review</h3>
                        <button 
                            onClick={onAccept}
                            className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition shadow-lg"
                        >
                            Can Accept - Proceed to Quote
                        </button>
                        <button 
                            onClick={onReject}
                            className="w-full py-3 bg-white text-rose-600 border-2 border-rose-200 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-300 transition shadow-sm"
                        >
                            Reject Order
                        </button>
                    </div>
                )}
            </div>
            {/* Expanded Image Modal with Print Function */}
            {isImageExpanded && currentOrder.design_image && (
                <div className="fixed inset-0 z-[99999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsImageExpanded(false)}
                        className="absolute top-6 right-6 text-white hover:text-stone-300 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Close image"
                    >
                        <span style={{ fontSize: '28px', lineHeight: '1', display: 'block' }}>×</span>
                    </button>

                    {/* Image Display */}
                    <div className="flex-1 flex items-center justify-center max-w-2xl">
                        <img 
                            src={getImageUrl()}
                            alt="Expanded Design Reference" 
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border-4 border-white/10"
                            loading="lazy"
                        />
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <button 
                            onClick={handlePrintJobTicket}
                            disabled={printLoading}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-stone-900 font-bold rounded-lg hover:bg-stone-100 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-base"
                        >
                            <span style={{ fontSize: '20px' }}>🖨</span>
                            {printLoading ? 'Generating...' : 'Print Job Ticket'}
                        </button>
                        <button 
                            onClick={() => setIsImageExpanded(false)}
                            className="flex items-center gap-3 px-8 py-4 bg-stone-700 text-white font-bold rounded-lg hover:bg-stone-600 transition-all duration-200 shadow-lg text-base"
                        >
                            <span>Close</span>
                        </button>
                    </div>

                    {/* Info Text */}
                    <div className="mt-6 text-center text-white/60 text-sm">
                        <p>Order #{currentOrder.id} • {currentOrder.user?.name || currentOrder.customer?.name || 'Customer'}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorOverview;
