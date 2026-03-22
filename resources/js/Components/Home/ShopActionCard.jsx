import React from 'react';
import SourceRefIcon from '@/Components/Home/SourceRefIcon';

export default function ShopActionCard({
    slot,
    shopId,
    otherShopId,
    shops,
    setShopId,
    imageUrl,
    accentClass,
    emptyHoverClass,
}) {
    const selected = shops.find((s) => String(s.id) === String(shopId));
    const selectId = `shop-${slot}-select`;

    const initials = selected
        ? selected.shop_name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'TS';

    return (
        <div
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-4 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px] text-center backdrop-blur-sm relative overflow-hidden ${
                shopId ? `shadow-2xl ${accentClass}` : `border-dashed border-stone-300 ${emptyHoverClass}`
            }`}
            onClick={() => !shopId && document.getElementById(selectId)?.showPicker()}
            style={
                shopId
                    ? {
                          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }
                    : {}
            }
        >
            {shopId ? (
                <>
                    <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto z-20">
                        <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl absolute inset-0 opacity-90" />
                        {initials}
                    </div>
                    <SourceRefIcon />
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl text-stone-800">{selected?.shop_name || `Shop ${slot}`}</h3>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShopId('');
                            }}
                            className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-sm transition-all duration-200"
                        >
                            Change
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                        <svg className="w-8 h-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-xl text-stone-600 mb-2">Select Shop {slot}</h3>
                    <p className="text-sm text-stone-500">Click to choose</p>
                    <select id={selectId} value={shopId} onChange={(e) => setShopId(e.target.value)} className="absolute opacity-0 h-0 w-0">
                        <option value="">— Select shop —</option>
                        {shops.map((s) => (
                            <option key={s.id} value={s.id} disabled={String(s.id) === String(otherShopId)}>
                                {s.shop_name}
                            </option>
                        ))}
                    </select>
                </>
            )}
        </div>
    );
}

