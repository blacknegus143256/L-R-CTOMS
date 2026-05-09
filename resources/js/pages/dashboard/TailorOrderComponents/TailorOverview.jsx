import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Camera, MapPin } from 'lucide-react';
import LocationMapModal from '@/Components/LocationMapModal'; // Adjust path if needed

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
    showRejectModal,
    rejectReasons,
    rejectData,
    setRejectData,
    handleReject,
    rejectProcessing 
}) => {
    const fitMethodName = currentOrder.fit_method?.name || currentOrder.fitMethod?.name || 'Unknown';
    const orderOwner = currentOrder.user || currentOrder.customer || {};
    const customerAddress = orderOwner.profile?.street
        ? `${orderOwner.profile.street}, ${orderOwner.profile.barangay || ''}`.replace(/,\s*$/, '')
        : 'No address provided';
    const isInShopFitting = fitMethodName === 'In-Shop Fitting';
    const measurementsRef = useRef(null);
    const [mapLocations, setMapLocations] = useState(null);
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

    useEffect(() => {
        if (shouldHighlightMeasurements && measurementsRef.current) {
            measurementsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [shouldHighlightMeasurements]);

    const markMaterialsReceived = () => {
        router.patch(route('store.orders.materials-received', currentOrder.id), {}, {
            preserveScroll: true,
        });
    };

    const handleViewMap = () => {
        if (fitMethodName === 'Home Visit') {
            setMapLocations([{
                lat: orderOwner.profile?.latitude,
                lng: orderOwner.profile?.longitude,
                shopName: `${orderOwner.name}'s Location`,
                street: orderOwner.profile?.street,
                barangay: orderOwner.profile?.barangay,
            }]);
        } else if (fitMethodName === 'In-Shop Fitting') {
            const shop = currentOrder.tailoring_shop || currentOrder.shop;
            setMapLocations([{
                lat: shop?.latitude,
                lng: shop?.longitude,
                shopName: shop?.shop_name || 'Tailoring Shop',
                street: shop?.street,
                barangay: shop?.barangay,
                google_maps_link: shop?.google_maps_link,
            }]);
        }
    };

    const markMeasurementsTaken = () => {
        router.patch(route('store.orders.measurements-taken', currentOrder.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Customer Request */}
            <div className="lg:col-span-2 space-y-8">
                <section className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border border-stone-200">
                        {currentOrder.design_image ? (
                            <img src={`/storage/${currentOrder.design_image}`} alt="Design Reference" className="w-full h-full object-cover" />
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
                                const qty = Number(item.quantity || item.pivot?.quantity || 1);
                                const shopAttribute = item.shopAttribute;
                                const unitPrice = Number(item.price || shopAttribute?.price || item.pivot?.price || 0);
                                
                                const targetAttrId = parseInt(shopAttribute?.attribute_type_id || item.attribute_type_id || item.attribute_id || item.attribute?.id);
                                const targetPrice = Number(item.price || item.pivot?.price || 0);
                                let exactShopItem = shopAttribute || availableShopAttributes?.find(a => parseInt(a.attribute_type_id || a.attribute_id || a.id) === targetAttrId && Number(a.price || a.pivot?.price || 0) === targetPrice);
                                if (!exactShopItem) exactShopItem = availableShopAttributes?.find(a => parseInt(a.attribute_type_id || a.attribute_id || a.id) === targetAttrId);
                                
                                const displayName = exactShopItem?.item_name || exactShopItem?.name || item.attribute_name || 'Item';
                                const unit = exactShopItem?.unit || 'unit';
                                
                                return (
                                    <li key={idx} className="flex justify-between items-center text-sm font-medium text-stone-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                        <div>
                                            <span className="font-bold text-slate-800 block">{displayName}</span>
                                            {unitPrice > 0 && (
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">₱{unitPrice.toLocaleString()} / {unit}</span>
                                            )}
                                        </div>
                                        <span className="text-stone-500 font-bold">x{qty}</span>
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
                                                        ✓ Done
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-amber-700 flex items-center gap-2">
                                                    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                            {currentOrder.material_source === 'customer' && !currentOrder.materials_received && isAtLeastConfirmed && (
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
                            {isInShopFitting ? (
                                <div className="flex justify-between items-baseline gap-4 rounded-xl border border-stone-700/70 bg-stone-800/40 px-3 py-2">
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">Appointment</span>
                                    <span className="font-bold text-cyan-300">{measurementDate ? formatAppointment(fittingAppointment) : 'TBD'}</span>
                                </div>
                            ) : null}
                            {isInShopFitting && !currentOrder.measurements_taken && isAtLeastConfirmed && (
                                <button
                                    type="button"
                                    onClick={markMeasurementsTaken}
                                    className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-950/20 transition-colors hover:bg-indigo-600"
                                >
                                    Mark Measurements Taken
                                </button>
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
                                {['Home Visit', 'In-Shop Fitting'].includes(fitMethodName) && (
                                    <button 
                                        type="button"
                                        onClick={handleViewMap}
                                        className="mt-3 w-full py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-4 h-4" /> View on Map
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
                            👍 Can Accept - Proceed to Quote
                        </button>
                        <button 
                            onClick={onReject}
                            className="w-full py-3 bg-white text-rose-600 border-2 border-rose-200 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-300 transition shadow-sm"
                        >
                            ❌ Reject Order
                        </button>
                    </div>
                )}
            </div>
            {mapLocations && (
                <LocationMapModal 
                    locations={mapLocations} 
                    onClose={() => setMapLocations(null)} 
                />
            )}
        </div>
    );
};

export default TailorOverview;
