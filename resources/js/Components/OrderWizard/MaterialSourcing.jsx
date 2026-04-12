import React from 'react';

export default function MaterialSourcing({ 
  service, 
  materialSource, 
  setMaterialSource, 
  materialAttrs, 
  selectedAttributes,
  toggleAttribute,
  attributeQuantities,
  updateAttributeQuantity,
  onNext,
  canNext,
  onBack
}) {
  if (!service) return null;

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-stone-800 mb-6">Material Selection</h3>

      {/* Move 1: The Handshake Info Card */}
      <div className="mb-8 p-6 bg-stone-900/5 border border-stone-200 rounded-3xl backdrop-blur-md">
          <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How it works
          </h4>
          <p className="text-stone-600 text-sm leading-relaxed">
            Choose if you are providing the materials or buying from us. After you submit, the tailor will review your request and confirm the schedule.
          </p>
      </div>

      {/* Move 2: The Two Big Choice Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Card A: Own Material */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="material_source"
            value="customer"
            checked={materialSource === 'customer'}
            onChange={(e) => setMaterialSource(e.target.value)}
            className="sr-only"
          />
          <div className={`h-48 border-4 rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center ${
            materialSource === 'customer' 
            ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
            : 'border-stone-200 hover:border-emerald-400 bg-white'
          }`}>
            <div className="w-16 h-16 mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="font-bold text-stone-800">I have my own items</h4>
            <p className="text-xs text-stone-500 mt-2">Bring your own fabric or repair items to the shop</p>
          </div>
        </label>

        {/* Card B: Shop Material */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="material_source"
            value="shop"
            checked={materialSource === 'shop'}
            onChange={(e) => setMaterialSource(e.target.value)}
            className="sr-only"
          />
          <div className={`h-48 border-4 rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center ${
            materialSource === 'shop' 
            ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
            : 'border-stone-200 hover:border-emerald-400 bg-white'
          }`}>
            <div className="w-16 h-16 mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="font-bold text-stone-800">Avail from the Shop</h4>
<p className="text-xs text-stone-500 mt-2">Purchase from our premium fabrics and stock (Added to total cost)</p>
          </div>
        </label>
      </div>

      {/* Dynamic Helper Text */}
      <div className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
        {materialSource === 'customer' ? (
          <p className="text-sm text-stone-600 font-medium">
            <span className="font-bold text-indigo-600">Optional Add-ons:</span> You are bringing your own main materials. If you need us to provide specific add-ons (like zippers or buttons), select them below. If you want the tailor to choose the best matching add-ons, simply leave this blank!
          </p>
        ) : (
          <p className="text-sm text-stone-600 font-medium">
            <span className="font-bold text-emerald-600">Choose Your Materials:</span> Select your desired fabrics and specifications below. If you aren't sure, leave this blank and our tailor will recommend the best options for your design!
          </p>
        )}
      </div>

      {/* Move 3: Catalog always visible */}
      {materialAttrs && materialAttrs.length > 0 && (
        // Group the flat array into categorized buckets
        (() => {
          const groupedMaterials = materialAttrs.reduce((acc, attr) => {
            const categoryName = attr.attributeCategory?.name || attr.attribute_category?.name || 'Additional Options';
            if (!acc[categoryName]) {
              acc[categoryName] = [];
            }
            acc[categoryName].push(attr);
            return acc;
          }, {});
          return (
            <div className="space-y-8">
              {Object.entries(groupedMaterials).map(([categoryName, items]) => (
                <div key={categoryName} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">
                    {categoryName}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map(attr => {
                      const uniqueId = attr.pivot?.id;
                      const isSelected = selectedAttributes.includes(uniqueId);
                      return (
                        <div key={uniqueId} className="flex flex-col gap-2 p-2">
<button
    type="button"
    onClick={() => toggleAttribute(uniqueId)}
    className={`p-4 text-left rounded-2xl border-2 transition-all w-full flex items-center gap-4 ${
        isSelected 
        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' 
        : 'border-stone-100 hover:border-indigo-200 bg-white'
    }`}
>
    {attr.pivot?.image_url ? (
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm bg-white">
            <img src={`/storage/${attr.pivot.image_url}`} alt={attr.pivot?.item_name || attr.name} className="w-full h-full object-cover" />
        </div>
    ) : (
        <div className="w-20 h-20 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-black text-stone-400">
            N/A
        </div>
    )}
    <div className="flex-1">
        <span className="block font-black text-stone-800 text-lg leading-tight mb-1">
            {attr.pivot?.item_name || attr.name}
        </span>
        <span className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
            {attr.name}
        </span>
        <span className="block text-sm font-black text-stone-700 bg-white inline-block px-2 py-1 rounded-lg border border-stone-100">
            +₱{attr.pivot?.price || 0} <span className="text-stone-400 font-bold text-xs">per {attr.pivot?.unit || 'unit'}</span>
        </span>
    </div>
</button>
                          {isSelected && (
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              placeholder="1.0"
                              value={attributeQuantities[uniqueId] === 0 ? '' : attributeQuantities[uniqueId]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  updateAttributeQuantity(uniqueId, 0);
                                } else {
                                  const parsed = parseFloat(val);
                                  if (!isNaN(parsed)) updateAttributeQuantity(uniqueId, parsed);
                                }
                              }}
                              className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm font-bold"
/>

                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}

      {/* Success Message for "Own Material" */}
      {materialSource === 'customer' && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="text-sm text-emerald-800 font-medium">
            Great! On the next page, you will pick the date you'll bring your items to the shop.
          </p>
        </div>
      )}

      {/* Move 4: Navigation Buttons */}
      <div className="flex gap-3 pt-6 border-t border-stone-100">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl border border-stone-300 py-4 font-bold text-stone-600 hover:bg-stone-50 transition-all"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all"
        >
          Next: Drop-off Date →
        </button>
      </div>
    </div>
  );
}

