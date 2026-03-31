import React from 'react';

export default function Logistics({ 
  service,
  materialDropoffDate,
  setMaterialDropoffDate,
  materialSource,
  setMaterialSource,
  setProfileMeasurements,
  onNext,
  canNext,
  onBack
}) {
  if (!service) return null;

  const today = new Date().toISOString().split('T')[0];
  const isDroppingOff = materialSource === 'dropoff';

  const effectiveCanNext =
   materialSource === 'workshop' ||
   (materialSource &&
  (!isDroppingOff || materialDropoffDate));
  React.useEffect(() => {
  if (!materialSource) {
    // Example logic — adjust based on your real data
    if (service?.allows_dropoff === false) {
      setMaterialSource('workshop');
    } else if (service?.requires_dropoff) {
      setMaterialSource('dropoff');
    }
    else {
    setMaterialSource('workshop'); // ✅ fallback
  }
  }
}, [service, materialSource]);
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Logistics</h3>

      {/* Cost-Saving Note */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-bold text-amber-800 mb-1">💰 Cost-Saving Tip</h4>
            <p className="text-amber-700 leading-relaxed">Bringing your own fabric/items? Save on project cost. Our workshop will work with what you provide!</p>
          </div>
        </div>
      </div>

      {/* Choice Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Yes - Drop Off */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="dropping_off"
            checked={isDroppingOff}
            onChange={() => setMaterialSource('dropoff')}
            className="sr-only"
          />
          <div className="h-48 border-2 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer border-emerald-300 hover:border-emerald-400 bg-emerald-50/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-green-400 rounded-3xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-emerald-800 mb-2">Yes, I will bring my own fabric/items</h4>
            <p className="text-emerald-700 font-medium mb-4">Select drop-off date below</p>
            {isDroppingOff && (
              <div className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full mx-auto w-fit font-medium mb-2">
                ✅ Selected
              </div>
            )}
          </div>
        </label>

        {/* No - Workshop Materials */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="dropping_off"
            checked={!isDroppingOff}
            onChange={() => setMaterialSource('workshop')}
            className="sr-only"
          />
          <div className={`h-48 border-2 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${!isDroppingOff ? 'border-blue-300 bg-blue-50/50 shadow-lg' : 'border-stone-300 hover:border-blue-400'}`}>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-3xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-blue-800 mb-2">No, use workshop materials/already provided</h4>
            <p className="text-blue-700 font-medium mb-4">Skip date picker</p>
            {!isDroppingOff && (
              <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full mx-auto w-fit font-medium mb-2">
                ✅ Selected
              </div>
            )}
          </div>
        </label>
      </div>

      {isDroppingOff && (
        <>
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl">
            <label className="block text-sm font-semibold text-emerald-800 mb-4">
              📅 Drop-off Date <span className="text-amber-600">*</span>
            </label>
            <input
              type="date"
              value={materialDropoffDate}
              onChange={(e) => setMaterialDropoffDate(e.target.value)}
              min={today}
              className="w-full rounded-2xl border-2 border-emerald-300 px-6 py-4 text-lg font-semibold text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg bg-white"
              required
            />
            <p className="text-sm text-emerald-700 mt-2 font-medium">Select date starting from today</p>
          </div>
          </>
        )}
      

      <div className="mt-8 flex gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!effectiveCanNext}
          className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 font-bold text-white text-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next: Measurements →
        </button>
      </div>
    </div>
  );
}

