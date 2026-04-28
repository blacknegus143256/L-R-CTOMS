import React from 'react';
import { router } from '@inertiajs/react';
import { Camera, ClipboardList } from 'lucide-react';

const formatDate = (value) => {
    if (!value) return 'TBD';

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'TBD' : date.toLocaleDateString();
};

const TailorOverview = ({ 
    currentOrder, 
    tailorMaterials, 
    availableShopAttributes,
    onAccept,
    onReject,
    showRejectModal,
    rejectReasons,
    rejectData,
    setRejectData,
    handleReject,
    rejectProcessing 
}) => {
    const normalizedMeasurementType = (currentOrder.measurement_type || '').toString().trim().toLowerCase();
    const rawStatus = (currentOrder.status || 'Requested').toString().trim().toLowerCase();
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

    const markMaterialsReceived = () => {
        router.patch(route('store.orders.materials-received', currentOrder.id), {}, {
            preserveScroll: true,
        });
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
                            <h3 className="text-xl font-black text-slate-800">{currentOrder.service?.service_name || 'Custom Order'}</h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {currentOrder.service?.serviceCategory?.name || 'Category'}
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
            </div>

            {/* Right Column: Logistics & Actions */}
            <div className="space-y-6">
                {/* Shop Items */}
                {currentOrder.items && currentOrder.items.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-100/50 mb-6">
                        <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Shop Items Availed</h3>
                        <ul className="space-y-3">
                            {currentOrder.items.map((item, idx) => {
                                const qty = Number(item.quantity || item.pivot?.quantity || 1);
                                const unitPrice = Number(item.price || item.pivot?.price || 0);
                                
                                const targetAttrId = parseInt(item.attribute_type_id || item.attribute_id || item.attribute?.id);
                                const targetPrice = Number(item.price || item.pivot?.price || 0);
                                let exactShopItem = availableShopAttributes?.find(a => parseInt(a.attribute_type_id || a.attribute_id || a.id) === targetAttrId && Number(a.price || a.pivot?.price || 0) === targetPrice);
                                if (!exactShopItem) exactShopItem = availableShopAttributes?.find(a => parseInt(a.attribute_type_id || a.attribute_id || a.id) === targetAttrId);
                                
                                const displayName = exactShopItem?.item_name || exactShopItem?.pivot?.item_name || item.attribute?.name || 'Item';
                                const unit = exactShopItem?.unit || exactShopItem?.pivot?.unit || 'unit';
                                
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
                    {['profile', 'self_measured'].includes(normalizedMeasurementType) && currentOrder.measurement_snapshot?.submitted && (
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm mt-6">
                            <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Customer Measurements ({currentOrder.measurement_snapshot.unit || 'in'})</h3>
                            <ul className="grid grid-cols-2 gap-4">
                                {Object.entries(currentOrder.measurement_snapshot.submitted).map(([part, value], idx) => (
                                    <li key={idx} className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{part}</span>
                                        <span className="text-lg font-black text-indigo-900">{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
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
{normalizedMeasurementType === 'none' || !normalizedMeasurementType
    ? 'No Measurements Needed' 
    : (normalizedMeasurementType === 'profile' || normalizedMeasurementType === 'self_measured'
        ? 'Self-Measured' 
        : 'In-Shop Fitting')}
                                </span>
                            </div>
                            {normalizedMeasurementType === 'scheduled' && !currentOrder.measurements_taken && isAtLeastConfirmed && (
                                <button
                                    type="button"
                                    onClick={markMeasurementsTaken}
                                    className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-950/20 transition-colors hover:bg-indigo-600"
                                >
                                    Mark Measurements Taken
                                </button>
                            )}
                        </div>
                        <div className="flex justify-between items-baseline border-b border-stone-700 pb-3">
                            <span className="text-xs uppercase tracking-wider opacity-80">Drop-off Date</span>
                            <span className="font-bold text-emerald-400">
                                {formatDate(currentOrder.material_dropoff_date)}
                            </span>
                        </div>
                        {['scheduled', 'workshop_fitting'].includes(normalizedMeasurementType) && <div className="flex justify-between items-baseline border-b border-stone-700 pb-3">
                            <span className="text-xs uppercase tracking-wider opacity-80">Fitting Date</span>
                            <span className="font-bold text-cyan-400">
                                {formatDate(currentOrder.measurement_date)}
                            </span>
                        </div>}
                        <div className="flex justify-between items-baseline border-b border-stone-700 pb-3">
                            <span className="text-xs uppercase tracking-wider opacity-80">Rush Order</span>
                            <span className={`font-bold ${currentOrder.rush_order || currentOrder.is_rush ? 'text-rose-400' : 'text-stone-400'}`}>
                                {currentOrder.rush_order || currentOrder.is_rush ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pt-2">
                            <span className="text-[10px] uppercase tracking-wider opacity-80">Target Deadline</span>
                            <span className="text-lg font-black text-white">
                                {formatDate(currentOrder.expected_completion_date)}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Review Actions */}
                {currentOrder.status === 'Requested' && (
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
        </div>
    );
};

export default TailorOverview;
