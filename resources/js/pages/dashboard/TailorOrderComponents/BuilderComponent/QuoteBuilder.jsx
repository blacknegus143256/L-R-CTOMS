import React, { useState, useMemo } from 'react';
import { Lock, Send, X, Check, ChevronRight, ImageOff } from 'lucide-react';

const QuoteBuilder = ({
    currentOrder,
    categories,
    isCustomerProvided,
    availableShopAttributes,
    itemsTotal,
    materials,
    updateMaterial,
    removeMaterialLocal,
    addMaterialLocal,
    isLocked,
    isLaborLocked,
    isFixedPrice,
    effectiveLaborPrice,
    setLaborPrice,
    rushFee,
    setRushFee,
    productionMinDays,
    setProductionMinDays,
    productionMaxDays,
    setProductionMaxDays,
    getInitialItemsTotal,
    calculateSubtotal,
    handleSendQuote,
    isSubmittingQuote,
    isQuoteLocked,
    canManageFinancials = true
}) => {
    const [materialSearch, setMaterialSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // 1. Filter attributes based on the search box
    const filteredAttributes = useMemo(() => {
        if (!availableShopAttributes) return [];
        const search = (materialSearch || '').toLowerCase();
        if (!search) return availableShopAttributes;
        return availableShopAttributes.filter(attr => {
            const name = (attr.pivot?.item_name || attr.name || '').toLowerCase();
            const category = (attr.attributeCategory?.name || attr.attribute_category?.name || attr.attribute_type?.name || attr.category?.name || 'Material').toLowerCase();
            return name.includes(search) || category.includes(search);
        });
    }, [availableShopAttributes, materialSearch]);

    // 2. Group the filtered results by category
    const groupedAttributes = useMemo(() => {
        return filteredAttributes.reduce((acc, attr) => {
            const category = attr.attributeCategory?.name || attr.attribute_category?.name || attr.attribute_type?.name || attr.category?.name || 'Material';
            if (!acc[category]) acc[category] = [];
            acc[category].push(attr);
            return acc;
        }, {});
    }, [filteredAttributes]);

    // (UI integration for search/grouping can be added later)

    return (
        <div className="bg-stone-900 p-4 sm:p-6 md:p-8 rounded-3xl border border-stone-800 shadow-xl text-white flex flex-col justify-between">
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-black text-white mb-1">
                        {isCustomerProvided ? 'Customer Shopping List' : 'Itemized Material Bill'}
                    </h2>
                    <p className="text-sm text-stone-400">
                        {isCustomerProvided 
                            ? 'List the materials the customer needs to bring to the shop.' 
                            : 'List the materials the shop will provide and charge for.'}
                    </p>
                </div>
                
                {/* Customer's Initial Selection (Read-Only) */}
                {currentOrder?.items && currentOrder.items.length > 0 && (
                    <div className="p-6 rounded-2xl border border-stone-700 mb-6 bg-stone-800/50 backdrop-blur-sm">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-4 block pb-3 border-b border-stone-700">
                            Customer's Initial Selection
                        </h4>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {currentOrder.items.map((item, idx) => {
                                // 1. Identify the core Shop Attribute ID
                                const shopAttrId = item.pivot?.shop_attribute_id || item.shop_attribute_id || item.id;

                                // 2. Cross-reference the live catalog to get the real names
                                const catalogItem = availableShopAttributes?.find(a => a.pivot?.id === shopAttrId || a.id === shopAttrId);

                                // 3. Extract the math
                                const qty = Number(item.quantity || item.pivot?.quantity || 1);
                                const unitPrice = Number(item.price || item.pivot?.price || catalogItem?.pivot?.price || catalogItem?.price || 0);
                                const lineTotal = unitPrice * qty;

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

                                const notes = catalogItem?.notes || item.notes || '';

                                const rawImage = catalogItem?.image_url || item.image_path || item.image_url || null;
                                const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : `/storage/${rawImage}`) : null;

                                return (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-stone-900 border border-stone-700 rounded-2xl shadow-sm gap-3 sm:gap-4 mb-3 last:mb-0">
                                        <div className="flex items-center gap-4 w-full">
                                            {imageUrl ? (
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 border border-stone-600">
                                                    <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-stone-800/50 flex items-center justify-center border border-stone-700 flex-shrink-0 text-stone-500 text-xs font-black">
                                                    N/A
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 w-full">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                                                    {categoryName}
                                                </span>
                                                <span className="text-sm font-bold text-stone-200 block mb-1">
                                                    {displayName}
                                                </span>
                                                {notes && (
                                                    <span className="text-[10px] font-medium text-stone-400 block mb-1 italic">
                                                        Note: {notes}
                                                    </span>
                                                )}
                                                {unitPrice > 0 ? (
                                                    <span className="text-xs text-stone-400 font-bold">
                                                        ₱{unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})} / {unit} <span className="text-stone-500 font-medium">× {qty}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded-lg border border-amber-700/50 inline-block">
                                                        Pending Quote
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {unitPrice > 0 && (
                                            <span className="text-base font-black text-emerald-400 flex-shrink-0">
                                                ₱{lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {itemsTotal > 0 && (
                            <div className="mt-4 pt-3 border-t border-stone-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Items Subtotal</span>
                                <span className="text-sm font-black text-emerald-400">₱{itemsTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tailor's Additional Requirements */}
                <div className="space-y-3 mb-6 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    {materials.map((mat, index) => (
                        <div key={`material-row-${mat.id ?? index}`} className="bg-stone-800 p-4 rounded-2xl border border-stone-700 space-y-3">
                                <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Item #{index + 1}</span>
                                <button onClick={!isLocked ? () => removeMaterialLocal(index) : undefined} disabled={isLocked} className={`text-rose-400 hover:text-rose-300 font-bold text-xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    <span className="inline-flex items-center gap-1"><X className="w-3 h-3" /> Remove</span>
                                </button>
                            </div>
                            <div className="space-y-3">
                                {isCustomerProvided ? (
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12 md:col-span-6">
                                            <select
                                                disabled={isLocked}
                                                id={`material-name-input-${index}`}
                                                name={`material-name-input-${index}`}
                                                value={mat.name || ''}
                                                onChange={(e) => updateMaterial(index, { name: e.target.value })}
                                                className={`w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="" disabled>Select material type...</option>
                                                {(categories || []).map((category) => (
                                                    <option key={category.id} value={category.name}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                            <input 
                                                disabled={isLocked} id={`material-quantity-${index}`} 
                                                name={`material-quantity-${index}`} 
                                                type="number" 
                                                min="0.1" 
                                                step="0.1" 
                                                placeholder="Qty" 
                                                value={mat.quantity} 
                                                onChange={(e) => updateMaterial(index, { quantity: Number(e.target.value) || 1 })}
                                                className={`w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`} 
                                            />
                                        </div>
                                        <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                            <select 
                                                disabled={isLocked} id={`material-unit-type-${index}`} 
                                                name={`material-unit-type-${index}`} 
                                                value={mat.unit} 
                                                onChange={(e) => updateMaterial(index, { unit: e.target.value })}
                                                className={`w-full bg-stone-900 border border-stone-600 rounded-xl px-2 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="unit">Unit</option>
                                                <option value="meters">Meters</option>
                                                <option value="yards">Yards</option>
                                                <option value="pieces">Pieces</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    !mat.id ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Select Material from Shop</label>
                                                <div className="relative w-full sm:w-1/2">
                                                    <input
                                                        type="text"
                                                        placeholder="Search materials..."
                                                        value={materialSearch}
                                                        onChange={(e) => setMaterialSearch(e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-stone-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                    />
                                                    {materialSearch && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMaterialSearch('')}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                                {Object.keys(groupedAttributes).length > 0 ? (
                                                    Object.entries(groupedAttributes).map(([category, items]) => {
                                                        const isExpanded = expandedCategories[category];
                                                        return (
                                                            <div key={category} className="space-y-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleCategory(category)}
                                                                    className="w-full flex items-center justify-between text-left border-b border-stone-700 pb-1 hover:border-emerald-500/50 transition-colors"
                                                                >
                                                                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">
                                                                        {category} <span className="text-stone-500 font-medium normal-case tracking-normal">({items.length})</span>
                                                                    </span>
                                                                    <span className="text-stone-500 text-[10px] font-black uppercase flex items-center gap-1">
                                                                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                        {isExpanded ? 'Hide' : 'Show'}
                                                                    </span>
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="grid grid-cols-1 gap-3">
                                                                        {items.map((attr, attrIdx) => {
                                                                            const isSelected = mat.id === attr.id;
                                                                            const rawImage = attr.image_url || attr.pivot?.image_url;
                                                                            const imageUrl = rawImage ? `/storage/${rawImage}` : null;
                                                                            const resolvedCategory = category;

                                                                            return (
                                                                                <div
                                                                                    key={`shop-inv-${attr.id}-${attrIdx}`}
                                                                                    onClick={!isLocked ? () => {
                                                                                        const img_url = rawImage ? (rawImage.startsWith('http') || rawImage.startsWith('/storage') ? rawImage : `/storage/${rawImage}`) : null;
                                                                                        updateMaterial(index, {
                                                                                            attribute_type_id: attr.attribute_type_id || attr.attribute_type?.id || null,
                                                                                            id: attr.id,
                                                                                            name: attr.pivot?.item_name || attr.name,
                                                                                            price: Number(attr.pivot?.price || attr.price || 0),
                                                                                            unit: attr.pivot?.unit || attr.unit || 'unit',
                                                                                            category: resolvedCategory,
                                                                                            notes: attr.notes || attr.pivot?.notes || '',
                                                                                            quantity: mat.quantity || 1,
                                                                                            image_url: img_url,
                                                                                        });
                                                                                    } : undefined}
                                                                                    className={`p-3 rounded-2xl border-2 transition-all ${isLocked ? 'pointer-events-none opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-stone-500'} ${isSelected ? 'border-emerald-500 bg-emerald-900/20 shadow-lg shadow-emerald-900/10 ring-2 ring-emerald-500/30' : 'border-stone-700 bg-stone-800/50'} flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4`}
                                                                                >
                                                                                    {imageUrl ? (
                                                                                        <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 border border-stone-600">
                                                                                            <img src={imageUrl} alt={attr.name} className="w-full h-full object-cover" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center flex-shrink-0 text-[8px] font-black text-stone-600 uppercase">
                                                                                            No Image
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <span className="block font-bold text-white text-sm leading-tight truncate">{attr.pivot?.item_name || attr.name}</span>
                                                                                        <span className="block text-[10px] font-bold text-stone-400 mt-0.5">₱{Number(attr.pivot?.price || attr.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} / {attr.pivot?.unit || attr.unit || 'unit'}</span>
                                                                                    </div>
                                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-stone-600'}`}>
                                                                                        {isSelected && <Check className="w-3 h-3 text-stone-900" />}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-stone-500 text-center py-6 border border-dashed border-stone-700 rounded-xl">No materials match your search.</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 p-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selected Material</span>
                                                <button 
                                                    onClick={!isLocked ? () => updateMaterial(index, { id: null, name: '', price: 0, unit: '', category: '', notes: '', image_url: null }) : undefined}
                                                    disabled={isLocked}
                                                    className={`text-xs font-bold text-amber-400 hover:text-amber-300 px-2 py-1 bg-amber-900/30 border border-amber-700/50 rounded-lg transition-colors whitespace-nowrap ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <div className="p-3 sm:p-4 bg-stone-800/50 border border-stone-600/50 rounded-2xl flex gap-3 sm:gap-4">
                                                {mat.image_url ? (
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-stone-600">
                                                        <img key={mat.id} src={mat.image_url} alt={mat.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center flex-shrink-0 text-[10px] sm:text-xs font-bold text-stone-500 uppercase">
                                                        <ImageOff className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-1.5 min-w-0">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">{mat.category || 'Material'}</span>
                                                    <span className="block font-bold text-white text-sm sm:text-base leading-tight truncate">{mat.name}</span>
                                                    {mat.notes && (
                                                        <span className="block text-[10px] text-stone-400 italic truncate">Note: {mat.notes}</span>
                                                    )}
                                                    <span className="block text-xs sm:text-sm font-bold text-stone-300 truncate">₱{Number(mat.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / {mat.unit || 'unit'}</span>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-stone-600/50">
                                                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Quantity</span>
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                disabled={isLocked}
                                                                type="number"
                                                                min="0.1"
                                                                step="0.1"
                                                                value={mat.quantity === '' ? '' : (mat.quantity ?? 1)}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    updateMaterial(index, { quantity: val === '' ? '' : Number(val) });
                                                                }}
                                                                onBlur={() => {
                                                                    if (mat.quantity === '' || Number(mat.quantity) <= 0) {
                                                                        updateMaterial(index, { quantity: 1 });
                                                                    }
                                                                }}
                                                                className={`w-16 sm:w-20 bg-stone-950 border border-stone-600/50 rounded-lg px-2 py-1.5 text-white text-sm font-bold text-center focus:ring-emerald-500 focus:border-emerald-500 outline-none shrink-0 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                            />
                                                            <span className="text-stone-400 text-xs font-bold truncate flex-shrink-0 max-w-[60px]">{mat.unit || 'unit'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                    <button onClick={!isLocked ? addMaterialLocal : undefined} disabled={isLocked} className={`w-full py-3 border-2 border-dashed border-stone-700 text-stone-400 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <span>+ Add Material</span>
                    </button>
                </div>

                {canManageFinancials ? (
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-2">
                                Base Labor Cost (₱)
                                {isFixedPrice && (
                                    <span className="bg-stone-800 text-stone-400 px-2 py-0.5 rounded text-[9px]">Fixed Price</span>
                                )}
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                value={effectiveLaborPrice === 0 ? '' : effectiveLaborPrice}
                                onChange={(e) => setLaborPrice(e.target.value)}
                                onBlur={() => {
                                    if (effectiveLaborPrice === '' || Number(effectiveLaborPrice) < 0) {
                                        const baseServicePrice = Number(currentOrder?.orderServices?.[0]?.price) || Number(currentOrder?.service?.price) || 0;
                                        setLaborPrice(baseServicePrice);
                                    } else {
                                        setLaborPrice(Number(effectiveLaborPrice));
                                    }
                                }}
                                disabled={isLaborLocked}
                                placeholder="0"
                                className={`w-full rounded-xl px-4 py-3 font-bold text-lg transition-colors ${
                                    isLaborLocked 
                                        ? 'bg-stone-900 border border-stone-800 text-stone-400 cursor-not-allowed opacity-80' 
                                        : 'bg-stone-800 border border-stone-700 text-white focus:ring-emerald-500 focus:border-emerald-500' 
                                }`}
                            />
                        </div>

                        {currentOrder?.is_rush && (
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2 mb-2">
                                    Rush Order Surcharge (₱)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={rushFee === 0 ? '' : rushFee}
                                    onChange={(e) => setRushFee(e.target.value)}
                                    onBlur={() => {
                                        if (rushFee === '' || Number(rushFee) < 0) {
                                            setRushFee(0);
                                        }
                                    }}
                                    disabled={isLocked}
                                    placeholder="0"
                                    className={`w-full rounded-xl px-4 py-3 font-bold text-lg transition-colors ${
                                        isLocked
                                            ? 'bg-stone-900 border border-stone-800 text-stone-400 cursor-not-allowed opacity-80'
                                            : 'bg-stone-800 border border-stone-700 text-white focus:ring-rose-400 focus:border-rose-400'
                                    }`}
                                />
                                <p className="text-[11px] text-stone-400 mt-1">Applied only when customer requested rush order.</p>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2 mb-2">
                                Estimated Production Time (Days)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={productionMinDays ?? ''}
                                    onChange={(e) => {
                                        const nextMin = e.target.value === '' ? '' : Number(e.target.value);
                                        setProductionMinDays(nextMin);

                                        if (
                                            nextMin !== '' &&
                                            productionMaxDays !== '' &&
                                            Number(nextMin) > Number(productionMaxDays)
                                        ) {
                                            setProductionMaxDays(Number(nextMin));
                                        }
                                    }}
                                    required
                                    disabled={isQuoteLocked}
                                    placeholder="Min days"
                                    className={`w-full rounded-xl px-4 py-3 font-bold text-sm transition-colors ${
                                        isQuoteLocked
                                            ? 'bg-stone-900 border border-stone-800 text-stone-400 cursor-not-allowed opacity-80'
                                            : 'bg-stone-800 border border-stone-700 text-white focus:ring-cyan-400 focus:border-cyan-400'
                                    }`}
                                />
                                <input
                                    type="number"
                                    min={productionMinDays || 1}
                                    step="1"
                                    value={productionMaxDays ?? ''}
                                    onChange={(e) => {
                                        const nextMax = e.target.value === '' ? '' : Number(e.target.value);

                                        if (
                                            nextMax === '' ||
                                            productionMinDays === '' ||
                                            Number(nextMax) >= Number(productionMinDays)
                                        ) {
                                            setProductionMaxDays(nextMax);
                                        }
                                    }}
                                    required
                                    disabled={isQuoteLocked}
                                    placeholder="Max days"
                                    className={`w-full rounded-xl px-4 py-3 font-bold text-sm transition-colors ${
                                        isQuoteLocked
                                            ? 'bg-stone-900 border border-stone-800 text-stone-400 cursor-not-allowed opacity-80'
                                            : 'bg-stone-800 border border-stone-700 text-white focus:ring-cyan-400 focus:border-cyan-400'
                                    }`}
                                />
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-stone-700 space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-stone-400">Initial Items Subtotal</span>
                                <span className="text-base font-bold text-stone-300">
                                    ₱{getInitialItemsTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-emerald-500/80">Added Materials Subtotal</span>
                                <span className="text-base font-bold text-emerald-400/80">
                                    + ₱{calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-cyan-300">Labor Subtotal</span>
                                <span className="text-base font-bold text-cyan-300">
                                    + ₱{Number(effectiveLaborPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {currentOrder?.is_rush && (
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-rose-300">Rush Surcharge</span>
                                    <span className="text-base font-bold text-rose-300">
                                        + ₱{Number(rushFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="w-full h-px bg-stone-700/50 my-2"></div>
                            <div className="flex justify-between items-end pt-1">
                                <span className="text-sm font-black text-stone-200 uppercase tracking-widest">Total Quote</span>
                                <span className="text-3xl font-black text-emerald-400">
                                    ₱{(Number(effectiveLaborPrice || 0) + calculateSubtotal() + getInitialItemsTotal() + Number(rushFee || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/70 px-5 py-6 text-sm text-stone-400">
                        Pricing and quote controls are restricted to the shop owner.
                    </div>
                )}
            </div>

            {canManageFinancials && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (handleSendQuote) handleSendQuote(e);
                    }}
                    disabled={isSubmittingQuote || isQuoteLocked}
                    className={`w-full mt-8 py-4 font-black text-lg rounded-xl transition-all shadow-lg ${
                        isQuoteLocked 
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700' 
                            : 'bg-emerald-500 text-stone-900 hover:bg-emerald-400 disabled:opacity-50'
                    }`}
                >
                    {isQuoteLocked ? (
                        <span className="inline-flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Quote Finalized / Locked</span>
                    ) : isSubmittingQuote ? (
                        'Sending...'
                    ) : (
                        <span className="inline-flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Send Financial Quote</span>
                    )}
                </button>
            )}
        </div>
    );
};

export default QuoteBuilder;
