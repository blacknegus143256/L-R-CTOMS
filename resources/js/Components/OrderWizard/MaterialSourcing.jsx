import React from 'react';

export default function MaterialSourcing({ 
  service, 
  materialSource, 
  setMaterialSource, 
  materialAttrs, 
  selectedAttributes,
  toggleAttribute,
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
            <p className="text-xs text-stone-500 mt-2">Pick from our available fabrics and stock</p>
          </div>
        </label>
      </div>

      {/* Move 3: Conditional Fabric List */}
      {materialSource === 'shop' && materialAttrs && materialAttrs.length > 0 && (
        <div className="mb-8">
          <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Available Fabrics</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {materialAttrs.map(attr => (
              <button
                key={attr.id}
                type="button"
                onClick={() => toggleAttribute(attr.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                  selectedAttributes.includes(attr.id)
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-stone-200 hover:border-emerald-300'
                }`}
              >
                <div className="font-bold text-stone-800 text-sm">{attr.name}</div>
                {attr.pivot?.price > 0 && (
                  <div className="text-emerald-600 text-xs font-bold mt-1">+₱{attr.pivot.price}</div>
                )}
              </button>
            ))}
          </div>
        </div>
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

