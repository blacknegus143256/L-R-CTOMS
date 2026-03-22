import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ComparisonTable({
    compareLoading,
    compareShops,
    categories,
    uniqueServiceCategories,
    onViewProfile,
    onSwapShop,
    onOpenLocationMap,
    onPlaceOrder,
    onGhostClick,
}) {
    const extraGhostCol = compareShops.length === 1 ? 1 : 0;
    const totalCols = 1 + compareShops.length + extraGhostCol;
    const filteredServiceCategories = useMemo(() => {
        if (compareShops.length === 0) return [];
        return uniqueServiceCategories.filter((category) =>
            compareShops.some((shop) => (shop.services || []).some((s) => s.service_category?.name === category))
        );
    }, [uniqueServiceCategories, compareShops]);

    const visibleAttributeCategories = useMemo(() => {
        if (compareShops.length === 0) return [];
        return categories
            .map((cat) => {
                const visibleAttrs = (cat.attribute_types || []).filter((attr) =>
                    compareShops.some((shop) => (shop.attributes || []).some((a) => a.id === attr.id && a.pivot))
                );
                return { ...cat, visibleAttrs };
            })
            .filter((cat) => cat.visibleAttrs.length > 0);
    }, [categories, compareShops]);

    return (
        <div className="rounded-xl border border-stone-200/80 bg-white/90 shadow-lg shadow-orchid-blue/5 overflow-hidden backdrop-blur-sm">
            {compareLoading ? (
                <div className="p-8 space-y-4 min-h-[400px]">
                    <div className="flex gap-8">
                        <div className="min-w-[180px] h-12 bg-gradient-to-r from-stone-200 to-stone-300 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex gap-8 h-20">
                                    <div className="min-w-[180px] h-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-lg animate-pulse" />
                                    <div className="flex-1 h-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-xl animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : compareShops.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead className="sticky top-0 z-20 bg-white/70 backdrop-blur-2xl shadow-md border-b border-white/40">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-lg text-stone-900 min-w-[180px] sticky left-0 z-30 bg-white/80 backdrop-blur-xl border-r border-stone-100/80">
                                    Service / Feature
                                </th>
                                {compareShops.map((shop, shopIndex) => (
                                    <th
                                        key={shop.id}
                                        className={`px-6 py-4 text-left font-bold text-lg min-w-[280px] ${
                                            shopIndex === 0 ? 'text-orchid-blue' : 'text-orchid-purple'
                                        }`}
                                    >
                                        <div className="text-xl font-bold mb-1 tracking-tight bg-gradient-to-r from-orchid-blue to-orchid-purple bg-clip-text text-transparent">
                                            {shop.shop_name}
                                        </div>
                                        <div className="text-sm font-normal text-stone-600 mb-2">{shop.contact_number || 'No phone'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onViewProfile(shop.id)}
                                                className="px-3 py-1 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95"
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onPlaceOrder?.(shop)}
                                                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95"
                                            >
                                                Place Order
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onSwapShop(shopIndex)}
                                                className="text-xs text-stone-500 hover:text-orchid-blue"
                                            >
                                                Swap
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                {compareShops.length === 1 && (
                                    <th className="px-6 py-4 text-left font-bold text-lg text-stone-400 min-w-[280px]">Challenger Slot</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="row-sweep border-b border-stone-100">
                                <td className="px-4 py-3 font-medium text-stone-600 sticky left-0 bg-white/90 backdrop-blur-sm z-10 border-r border-stone-100">
                                    Location
                                </td>
                                {compareShops.map((shop) => {
                                    const profile = shop.user?.profile;
                                    const lat = profile?.latitude;
                                    const lng = profile?.longitude;
                                    const hasCoords = lat && lng;
                                    const addressParts = [
                                        profile?.purok ? `Purok ${profile.purok}` : null,
                                        profile?.street,
                                        profile?.barangay ? `Brgy. ${profile.barangay}` : null,
                                    ]
                                        .filter(Boolean)
                                        .join(', ');
                                    return (
                                        <td key={shop.id} className="px-4 py-3 text-stone-700 relative z-0">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">{addressParts || 'Address not set'}</span>
                                                {hasCoords && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onOpenLocationMap({
                                                                lat,
                                                                lng,
                                                                shopName: shop.shop_name,
                                                                street: profile?.street,
                                                                barangay: profile?.barangay,
                                                            })
                                                        }
                                                        className="text-xs bg-stone-100/90 px-2 py-1 rounded text-stone-600 hover:bg-stone-200 transition w-fit"
                                                    >
                                                        Pinpoint
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                                {compareShops.length === 1 && (
                                    <td className="px-4 py-3">
                                        <div
                                            className="h-full min-h-[84px] border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 animate-pulse cursor-pointer hover:border-orchid-blue/60 hover:bg-orchid-blue/5 transition-all"
                                            onClick={onGhostClick}
                                            onKeyDown={(e) => e.key === 'Enter' && onGhostClick?.()}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="text-2xl font-bold">+</div>
                                            <div className="text-xs text-center px-2">
                                                Choose a challenger from the carousel above to compare prices.
                                            </div>
                                        </div>
                                    </td>
                                )}
                            </tr>

                            {filteredServiceCategories.length > 0 && (
                                <>
                                    <tr className="border-b border-stone-100">
                                        <td colSpan={totalCols} className="px-4 py-2 font-semibold text-stone-700 bg-stone-50/90">
                                            Services
                                        </td>
                                    </tr>
                                    {filteredServiceCategories.map((category) => {
                                        const allServices = compareShops.flatMap((shop) =>
                                            (shop.services || []).filter((s) => s.service_category?.name === category)
                                        );
                                        const minPrice = allServices.length
                                            ? Math.min(...allServices.map((s) => Number(s.price ?? s.starting_price ?? 0)).filter((p) => p > 0))
                                            : null;

                                        return (
                                            <motion.tr
                                                key={category}
                                                layout
                                                className="row-sweep border-b border-stone-100 hover:bg-orchid-blue/5 transition-colors"
                                                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                                            >
                                                <td className="px-6 py-4 pl-8 font-semibold text-stone-800 bg-gradient-to-r from-orchid-blue/5 to-transparent border-r border-stone-200 sticky left-0 z-10 bg-white/95 backdrop-blur-sm">
                                                    {category}
                                                </td>
                                                {compareShops.map((shop, idx) => {
                                                    const shopServices = (shop.services || []).filter((s) => s.service_category?.name === category);
                                                    return (
                                                        <td key={shop.id} className={`px-6 py-4 relative z-0 ${idx === 0 ? 'border-r-2 border-stone-100' : ''}`}>
                                                            {shopServices.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {shopServices.map((s, i) => {
                                                                        const price = Number(s.price ?? s.starting_price ?? 0);
                                                                        const isWinner = minPrice !== null && price === minPrice && minPrice > 0;
                                                                        const delta = minPrice !== null ? price - minPrice : 0;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className="border border-stone-200/80 rounded-xl p-3 bg-slate-50/80 shadow-sm relative z-0"
                                                                            >
                                                                                <div className="font-bold text-stone-900">
                                                                                    {s.service_name || 'Standard Service'}
                                                                                </div>
                                                                                <div className="mt-1 flex flex-wrap items-center gap-1">
{isWinner ? (
                                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-orchid-blue to-orchid-purple rounded-lg shadow-[0_0_15px_rgba(176,106,179,0.4)] transform scale-105 border border-white/20">
                                                                                            <span className="text-white font-black text-sm mr-1">₱</span>
                                                                                            <span className="text-white font-black text-lg tracking-tight">
                                                                                                {Number(price).toLocaleString()}
                                                                                            </span>
                                                                                            <div className="ml-2 bg-white/20 rounded-full p-0.5">
                                                                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-slate-950 rounded-lg shadow-lg border border-white/10">
                                                                                            <span className="text-white font-black text-sm uppercase mr-1 opacity-70">₱</span>
                                                                                            <span className="text-white font-black text-lg tracking-tight">
                                                                                                {Number(price).toLocaleString()}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-md text-xs uppercase font-bold">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                {compareShops.length === 1 && (
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className="h-full min-h-[84px] border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 animate-pulse cursor-pointer hover:border-orchid-blue/60 hover:bg-orchid-blue/5 transition-all"
                                                            onClick={onGhostClick}
                                                            role="button"
                                                            tabIndex={0}
                                                            onKeyDown={(e) => e.key === 'Enter' && onGhostClick?.()}
                                                        >
                                                            <div className="text-2xl font-bold">+</div>
                                                        </div>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        );
                                    })}
                                </>
                            )}

                            {visibleAttributeCategories.length > 0 && (
                                <tr className="border-b border-stone-100">
                                    <td colSpan={totalCols} className="px-4 py-2 font-semibold text-stone-700 bg-stone-50/90 uppercase tracking-wide">
                                        Materials & Specifications
                                    </td>
                                </tr>
                            )}
                            {visibleAttributeCategories.map((cat) => (
                                <React.Fragment key={cat.id}>
<tr className="row-sweep border-b border-stone-100 hover:bg-orchid-blue/5 transition-colors">
    <td colSpan={totalCols} className="px-4 py-2 font-semibold text-stone-700 bg-stone-50/80">
        {cat.name}
    </td>
</tr>
                                    {(cat.visibleAttrs || []).map((attr) => {
                                        const allAttrPrices = compareShops.flatMap((shop) =>
                                            (shop.attributes || [])
                                                .filter((a) => a.id === attr.id && a.pivot)
                                                .map((a) => Number(a.pivot?.price ?? 0))
                                                .filter((p) => p > 0)
                                        );
                                        const globalMin = allAttrPrices.length ? Math.min(...allAttrPrices) : null;

                                        return (
                                            <motion.tr
                                                key={attr.id}
                                                layout
                                                className="row-sweep border-b border-stone-100"
                                                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                                            >
                                                <td className="px-4 py-2 pl-4 text-stone-600 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-stone-100">
                                                    {attr.name}
                                                </td>
                                                {compareShops.map((shop) => {
                                                    const matchedItems = (shop.attributes || []).filter((a) => a.id === attr.id && a.pivot);
                                                    return (
                                                        <td key={shop.id} className="px-4 py-3 relative z-0">
                                                            {matchedItems.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {matchedItems.map((item, i) => {
                                                                        const itemPrice = Number(item.pivot?.price ?? 0);
                                                                        const isLineWinner =
                                                                            globalMin !== null && itemPrice > 0 && itemPrice === globalMin;
                                                                        const over =
                                                                            globalMin !== null && itemPrice > globalMin ? itemPrice - globalMin : 0;
                                                                        return (
                                                                            <li key={i} className="border-b border-stone-50 last:border-0 pb-1">
                                                                                <div className="text-stone-800 font-medium">
                                                                                    {item.pivot?.item_name || 'Generic'}
                                                                                </div>
                                                                                <div className="mt-0.5 flex flex-wrap items-center gap-1">
{isLineWinner ? (
                                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-orchid-blue to-orchid-purple rounded-lg shadow-[0_0_15px_rgba(176,106,179,0.4)] transform scale-105 border border-white/20">
                                                                                            <span className="text-white font-black text-sm mr-1">₱</span>
                                                                                            <span className="text-white font-black text-lg tracking-tight">
                                                                                                {Number(itemPrice).toLocaleString()}
                                                                                            </span>
                                                                                            <div className="ml-2 bg-white/20 rounded-full p-0.5">
                                                                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-slate-950 rounded-lg shadow-lg border border-white/10">
                                                                                            <span className="text-white font-black text-sm uppercase mr-1 opacity-70">₱</span>
                                                                                            <span className="text-white font-black text-lg tracking-tight">
                                                                                                {Number(itemPrice).toLocaleString()}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            ) : (
                                                                <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-md text-xs uppercase font-bold">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                {compareShops.length === 1 && (
                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="h-full min-h-[52px] border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center text-stone-400 animate-pulse cursor-pointer hover:border-orchid-blue/60 hover:bg-orchid-blue/5 transition-all"
                                                            onClick={onGhostClick}
                                                            role="button"
                                                            tabIndex={0}
                                                            onKeyDown={(e) => e.key === 'Enter' && onGhostClick?.()}
                                                        >
                                                            +
                                                        </div>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-12 text-center text-stone-500">Select one or two shops to start comparison.</div>
            )}
        </div>
    );
}
