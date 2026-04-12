import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import StatusBadge from './StatusBadge';
import TimelineNode from './TimelineNode';
import DateRow from './DateRow';
import SpecRow from './SpecRow';

export default function ViewDetailsModal({ order, onClose, isAdmin = false }) {
    if (!order) return null;

    const { props } = usePage();
    
    // Get potential shop objects from both contexts
    const shopFromProps = props.shop || props.auth?.shop;
    const shopFromOrder = order?.tailoringShop || order?.tailoring_shop;

    // Smart fallback: prioritize the shop object that ACTUALLY has the attributes loaded
    const shop = shopFromProps?.attributes 
        ? shopFromProps 
        : (shopFromOrder?.attributes 
            ? shopFromOrder 
            : (shopFromProps || shopFromOrder || {}));
            
    const availableShopAttributes = useMemo(() => shop.attributes || [], [shop.attributes]);

    const profile = order?.user?.profile || order?.customer || {};

    const [localMeasurements, setLocalMeasurements] = useState({});
    const [isSaving, setIsSaving] = useState(false);

// New editing states
    const [isEditingInvoice, setIsEditingInvoice] = useState(false);

    // New derived state function to map order items precisely to shop pivot IDs
    const mapOrderItemsToSelectedState = useMemo(() => () => {
        return order.items?.map(item => {
            // Cross-check master attribute ID and exact price to find the correct shop inventory item
            const matchingShopAttr = availableShopAttributes.find(a => 
                parseInt(a.attribute_type_id || a.id) === parseInt(item.attribute_type_id) &&
                Number(a.pivot?.price) === Number(item.price)
            );
            
            // Return precisely calculated pivot IDs
            return {
                pivot_id: matchingShopAttr ? parseInt(matchingShopAttr.pivot.id) : null,
                qty: Number(item.quantity) || 1
            };
        }).filter(item => item.pivot_id !== null) || []; // Filter any generic fallbacks
    }, [order.items, availableShopAttributes]);

    // Initialize state with precision mapper
    const [selectedItems, setSelectedItems] = useState(mapOrderItemsToSelectedState());

    // BUG FIX: Synchronize internal state with parent props when order is updated after saving
    useEffect(() => {
        setSelectedItems(mapOrderItemsToSelectedState());
    }, [order, mapOrderItemsToSelectedState]);

    const calculateNewTotal = useMemo(() => {
        const basePrice = Number(order.service?.price || 0);
        
        const addonsTotal = selectedItems.reduce((sum, item) => {
            const attr = availableShopAttributes.find(a => a.pivot?.id === item.pivot_id);
            const attrPrice = Number(attr?.pivot?.price || 0);
            return sum + (attrPrice * item.qty);
        }, 0);

        return basePrice + addonsTotal;
    }, [order.service?.price, selectedItems, availableShopAttributes]);

    const handleSaveInvoice = () => {
        const validItems = selectedItems.filter(item => item.qty > 0);
        router.patch(`/api/shops/${shop.id}/orders/${order.id}`, {
            total_price: calculateNewTotal,
            attributes: validItems
        }, {
            onSuccess: () => { 
                setIsEditingInvoice(false); 
                
                router.reload({ preserveScroll: true });
                alert("Invoice Updated!");
                // The pure Inertia SPA way to refresh data smoothly
            },
            preserveScroll: true
        });
    };

    const toggleAttribute = (pivotId) => {
        setSelectedItems(prev => {
            const exists = prev.find(item => item.pivot_id === pivotId);
            if (exists) {
                return prev.filter(item => item.pivot_id !== pivotId);
            } else {
                return [...prev, { pivot_id: pivotId, qty: 1 }];
            }
        });
    };

    const handleQtyChange = (pivotId, newQty) => {
        setSelectedItems(prev => 
            prev.map(item => 
                item.pivot_id === pivotId 
                    ? { ...item, qty: newQty } // Removed the Math.max(0.01) clamp to allow smooth typing
                    : item
            )
        );
    };

    // Group attributes by category
    const groupedAttributes = useMemo(() => {
        const groups = {};
        availableShopAttributes.forEach(attr => {
            const category = attr.attributeCategory?.name || attr.attribute_category?.name || 'Uncategorized';
            if (!groups[category]) groups[category] = [];
            groups[category].push(attr);
        });
        return groups;
    }, [availableShopAttributes]);

    const handleSaveMeasurements = () => {
        setIsSaving(true);
        router.patch('/profile', {
            ...order.user,
            ...localMeasurements
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsSaving(false);
                alert('Draft measurements saved to your profile!');
            },
            onError: () => {
                setIsSaving(false);
                alert('Failed to save draft. Please try again.');
            }
        });
    };

    const getMaterialSourceText = (source) => {
        if (source === 'customer') {
          if (order.items && order.items.length > 0) {
            return 'Customer Provided + Shop Add-ons';
          }
          return 'Customer Provided';
        }
        if (source === 'tailor_choice' || source === 'shop') return 'Workshop Provided';
        return 'Not Specified';
    };

    const getMeasurementText = (type) => {
        if (type === 'scheduled') return 'In-Shop Fitting';
        if (type === 'profile') return 'Self-Measured (Profile)';
        return 'Not Specified';
    };

    const canEditInvoice = isAdmin && ['Pending', 'Accepted', 'Appointment Scheduled'].includes(order.status);

    const currentTotal = isEditingInvoice ? calculateNewTotal : Number(order.total_price);

    const getSelectedItem = (pivotId) => selectedItems.find(item => item.pivot_id === parseInt(pivotId));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[90rem] overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-8 border-b border-stone-100 flex justify-between items-start bg-stone-50/30">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Order #{order.id}</h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-xl font-bold text-stone-700">{order.service?.service_name}</h3>
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-md">
                                {order.service?.serviceCategory?.name || order.service?.service_category?.name || 'Custom Service'}
                            </span>
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-3">
                            Placed: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-all font-bold">✕</button>
                </div>

                {/* Timeline */}
                <div className="px-12 py-6 bg-white border-b border-stone-100 relative">
                    <div className="absolute top-[35px] left-[15%] right-[15%] h-[2px] bg-stone-100 z-0" />
                    <div className="flex justify-between items-center relative z-10">
                        <TimelineNode label="Confirmed" date={order.created_at} active={true} />
                        <TimelineNode label="Measured" date={order.measurement_date} active={!!order.measurement_date || !['Pending', 'Cancelled'].includes(order.status)} />
                        <TimelineNode label="In Work" active={['Accepted', 'Appointment Scheduled', 'In Progress'].includes(order.status)} />
                        <TimelineNode label="Pickup" date={order.expected_completion_date} active={order.status === 'Ready' || order.status === 'Completed'} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        
                        {/* LEFT COLUMN: Design Context */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Customer Details */}
                            <section>
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Customer Details</h3>
                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-white border border-stone-100 rounded-xl">
                                        <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Name</span>
                                            <span className="font-semibold text-stone-900">{order.user?.name || order.customer?.name || 'Not Provided'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-white border border-stone-100 rounded-xl">
                                        <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.27 7.27c.883.883 2.307.883 3.19 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Email</span>
                                            <span className="font-semibold text-stone-900">{order.user?.email || order.customer?.email || 'Not Provided'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-white border border-stone-100 rounded-xl">
                                        <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Phone</span>
                                            <span className="font-semibold text-stone-900">{profile.phone || order.customer?.phone_number || 'Not Provided'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-white border border-stone-100 rounded-xl">
                                        <svg className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Address</span>
                                            <span className="font-semibold text-stone-900">{profile.street ? `${profile.street}, ${profile.barangay}` : profile.city ? profile.city : 'Not Provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Design Context</h3>
                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 flex flex-col md:flex-row gap-6">
                                    {/* Design Image */}
                                    <div className="w-full md:w-1/3 aspect-[3/4] bg-stone-200 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                                        {order.design_image ? (
                                            <img src={`/storage/${order.design_image}`} alt="Design Reference" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <span className="text-xs font-medium uppercase tracking-wider">No Image Provided</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Context Details */}
                                    <div className="flex-1 space-y-6">
                                        {order.style_tag && (
                                            <div>
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Style Tag</span>
                                                <span className="inline-block px-4 py-2 bg-white border border-stone-200 text-stone-800 rounded-xl text-sm font-bold shadow-sm">
                                                    {order.style_tag}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Material & Add-on Charges</span>
                                            {order.items && order.items.length > 0 ? (
                                                <div className="flex flex-col gap-2">
{order.items.map((item, idx) => {
    // Find the exact shop item to grab custom names and images
    const exactShopItem = availableShopAttributes.find(a => 
        parseInt(a.attribute_type_id || a.id) === parseInt(item.attribute_type_id) &&
        Number(a.pivot?.price) === Number(item.price)
    );

    const attrCategory = exactShopItem?.attributeCategory?.name || item.attribute?.attribute_category?.name || 'Specification';
    
    // Use the custom item_name from the pivot table, fallback to master name
    const attrName = exactShopItem?.pivot?.item_name || exactShopItem?.name || item.attribute?.name || 'Custom Add-on';
    
// Grab the image URL from the pivot table, fallback to the item's loaded attribute data
    const imageUrl = exactShopItem?.pivot?.image_url || item.attribute?.image_url || item.image_url;
    
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * qty;

    return (
        <div key={idx} className="flex justify-between items-center p-5 bg-white border border-stone-200 rounded-2xl shadow-sm gap-5">
        <div className="flex items-center gap-4">
        {imageUrl ? (
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200 shadow-lg">
                <img src={`/storage/${imageUrl}`} alt={attrName} className="w-full h-full object-cover" />
            </div>
        ) : (
            <div className="w-24 h-24 rounded-3xl bg-stone-50 flex items-center justify-center border border-stone-100 flex-shrink-0 text-stone-300 text-base font-black">
                N/A
            </div>
        )}
        <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block mb-1">{attrCategory}</span>
            <span className="text-base font-bold text-stone-800 block mb-1">{attrName}</span>
            <span className="text-xs text-stone-500 block font-bold">
                ₱{unitPrice.toFixed(2)} x {qty}
            </span>
        </div>
    </div>
    <span className="text-lg font-black text-indigo-600 flex-shrink-0">₱{lineTotal.toFixed(2)}</span>
</div>
    );
})}

                                                </div>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">
                                                    {order.material_source === 'customer' 
                                                        ? "Base labor only. Materials provided by customer." 
                                                        : "Waiting for tailor to add workshop materials."}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Customer Notes</span>
                                            <p className="text-sm text-stone-700 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                                                {order.notes || 'No additional notes provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Project Logistics</h3>
                                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Materials</p>
                                        <p className="text-sm font-semibold text-stone-800">{getMaterialSourceText(order.material_source)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Fit Method</p>
                                        <p className="text-sm font-semibold text-stone-800">{getMeasurementText(order.measurement_type)}</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Dates & Measurements */}
                        <div className="space-y-8">
                            
                            <section className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
                                <h3 className="text-[11px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-6">Measurements</h3>
                                
                                {order.measurement_type === 'scheduled' ? (
                                    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-indigo-100">
                                        <div className="text-3xl mb-3">📍</div>
                                        <h4 className="font-bold text-indigo-900 mb-1">In-Shop Fitting</h4>
                                        <p className="text-xs text-indigo-600">Measurements will be taken professionally at the workshop.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {order.measurement_snapshot?.requested?.length > 0 ? (
                                            order.measurement_snapshot.requested.map((measure, idx) => {
                                                const profileKey = measure.toLowerCase().replace(/ /g, '_');
                                                const val = order.measurement_snapshot?.values?.[profileKey];

                                                return isAdmin ? (
                                                    <SpecRow 
                                                        key={idx} 
                                                        label={measure.toUpperCase()} 
                                                        value={val ? `${val} IN` : 'TBA'} 
                                                    />
                                                ) : (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-indigo-100 rounded-xl shadow-sm">
                                                        <span className="font-bold text-sm text-indigo-900 capitalize">{measure}</span>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={localMeasurements[profileKey] || ''}
                                                            onChange={(e) => setLocalMeasurements({
                                                                ...localMeasurements,
                                                                [profileKey]: e.target.value
                                                            })}
                                                            className="w-20 text-right border border-indigo-200 rounded-lg px-2 py-1 text-sm font-bold bg-indigo-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="0.0"
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-indigo-100">
                                                <p className="text-xs text-indigo-600 font-medium">Awaiting shop measurement request.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Customer Action Buttons */}
                                {!isAdmin && order.measurement_snapshot?.requested?.length > 0 && (
                                    <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-stone-100">
                                        <button 
                                            onClick={handleSaveMeasurements}
                                            disabled={isSaving}
                                            className="w-full py-3 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-200 transition shadow-sm disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : '💾 Save to Profile (Draft)'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => {
                                                setIsSaving(true);
                                                router.patch(`/my-orders/${order.id}/measurements`, {
                                                    measurements: localMeasurements
                                                }, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    onSuccess: () => {
                                                        setIsSaving(false);
                                                        alert('✅ Final measurements have been securely sent to the shop!');
                                                        onClose();
                                                    },
                                                    onError: () => {
                                                        setIsSaving(false);
                                                        alert('Failed to send measurements. Please check your inputs.');
                                                    }
                                                });
                                            }}
                                            disabled={isSaving}
                                            className="w-full py-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                                        >
                                            📤 Send as Final Measurement
                                        </button>
                                    </div>
                                )}
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Schedule</h3>
                                <DateRow label="📅 Fitting Appointment" date={order.measurement_date} isAdmin={isAdmin} />
                                <DateRow label="📦 Material Drop-Off" date={order.material_dropoff_date} isAdmin={isAdmin} />
                                <DateRow label="🏁 Expected Pickup" date={order.expected_completion_date} isAdmin={isAdmin} isHighlight />
                            </section>

                            {/* Edit Invoice Section */}
                            {canEditInvoice && (
                                <>
                                    {isEditingInvoice ? (
                                        <section className="p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm">
                                            <h3 className="text-[11px] font-black text-amber-800 uppercase tracking-[0.2em] mb-6">Edit Invoice - Add Materials</h3>
                                            
                                            <div className="mb-6">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-4">Select Materials to Add:</p>
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {availableShopAttributes.length === 0 ? (
                                                        <p className="text-xs text-stone-500 italic">No inventory items found in shop record.</p>
                                                    ) : (
                                                        Object.entries(groupedAttributes).map(([category, attrs]) => (
                                                            <div key={category} className="space-y-2">
                                                                <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">{category}</h4>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {attrs.map(attr => {
                                                                        const pivotId = parseInt(attr.pivot?.id);
                                                                        const selItem = getSelectedItem(pivotId);
                                                                        const isSelected = !!selItem;
                                                                        const unit = attr.pivot?.unit || 'units';
                                                                        return (
                                                                            <div key={pivotId} className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all bg-white">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleAttribute(pivotId)}
                                                                                    className={`flex-1 justify-between items-center p-2 rounded-lg border transition-all text-left ${
                                                                                        isSelected 
                                                                                            ? 'border-amber-500 bg-amber-100 text-amber-900 font-bold border-2' 
                                                                                            : 'border-stone-200 hover:border-amber-300'
                                                                                    }`}
                                                                                >
                                                                                    <span className="font-bold text-xs">{attr.pivot?.item_name || attr.name}</span>

                                                                                    <span className="font-black text-xs">₱{attr.pivot?.price}/{unit}</span>
                                                                                </button>
                                                                                {isSelected && (
<input
  type="number"
  min="0"
  step="0.1"
  // UX Fix: Allow empty string for easy backspacing
  value={selItem.qty === 0 ? '' : selItem.qty}
  placeholder="1.0"
  onChange={(e) => {
    const val = e.target.value;
    if (val === '') {
      handleQtyChange(pivotId, 0); // Allow empty state
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) handleQtyChange(pivotId, parsed);
    }
  }}
  className="w-20 h-10 text-right border border-amber-300 rounded-lg px-2 py-1 text-sm font-bold bg-amber-50 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
/>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Dynamic Total Preview */}
                                            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-inner mb-6">
                                                <div className="flex justify-between text-sm font-bold text-amber-800 mb-2">
                                                    <span>Preview Total:</span>
                                                    <span>₱{Number(currentTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={handleSaveInvoice}
                                                    className="flex-1 py-3 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition shadow-lg"
                                                >
                                                    💾 Save Invoice
                                                </button>
                                                <button 
                                                    onClick={() => setIsEditingInvoice(false)}
                                                    className="px-6 py-3 bg-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-300 transition shadow-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </section>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingInvoice(true)}
                                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg text-sm uppercase tracking-wide"
                                        >
                                            ✏️ Edit Invoice & Add Materials
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Total Invoice Section */}
                            <section className="p-6 rounded-3xl bg-stone-900 text-white shadow-xl">
        {/* New explicit base labor calculation line */}
                                <div className="flex justify-between items-baseline opacity-80 mb-3 border-b border-white/10 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider">{order.service?.service_name} (Base Labor)</span>
                                    <span className="text-xl font-bold">₱{Number(order.service?.price).toFixed(2)}</span>
                                </div>

                                {/* Materials/Add-ons subtotal line */}
                                <div className="flex justify-between items-baseline opacity-80 mb-5 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider">Materials & Hardware</span>
                                    <span className="text-xl font-bold">₱{(Number(currentTotal) - Number(order.service?.price)).toFixed(2)}</span>
                                </div>

                                {/* Final calculated Grand Total */}
                                <div className="flex justify-between items-baseline pt-2 border-t-2 border-white/10">
                                    <span className="text-sm font-bold opacity-90">Grand Total</span>
                                    <span className="text-4xl font-black text-amber-400">₱{Number(currentTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isAdmin ? 'text-indigo-600' : 'text-stone-400'}`}>
                        {isAdmin ? 'Admin Portal • Order Details' : 'Customer Portal • Order Details'}
                    </span>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider bg-white border-2 border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white transition-all shadow-sm"
                    >
                        Close Panel
                    </button>
                </div>
            </div>
            </div>
    );
}

