import React from 'react';

export default function Logistics({ 
  service,
  materialDropoffDate,
  setMaterialDropoffDate,
  materialSource,
  setMaterialSource,
  onNext,
  onBack
}) {
  if (!service) return null;

  const today = new Date().toISOString().split('T')[0];
  const isDroppingOff = materialSource === 'customer';
  const isWorkshop = materialSource === 'tailor_choice';

  // Strictly require a choice. If dropoff, strictly require a date.
  const effectiveCanNext = isWorkshop || (isDroppingOff && !!materialDropoffDate);

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

      {/* Choice Cards - NO PRE-SELECTION */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Yes - Drop Off */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="dropping_off"
            checked={isDroppingOff}
            onChange={() => {
              setMaterialSource('customer'); // ✅ Fixed
              setMaterialDropoffDate(''); 
            }}
            className="sr-only"
          />
          <div className={`h-48 border-2 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDroppingOff ? 'border-emerald-400 bg-emerald-50 shadow-lg ring-2 ring-emerald-200' : 'border-stone-300 hover:border-emerald-300'}`}>
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${isDroppingOff ? 'bg-gradient-to-br from-emerald-400 to-green-400' : 'bg-stone-200'}`}>
              <svg className={`w-10 h-10 ${isDroppingOff ? 'text-white' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-stone-800 mb-2">Yes, I will bring materials</h4>
            <p className="text-stone-600 font-medium mb-4">Select drop-off date below</p>
          </div>
        </label>

        {/* No - Workshop Materials */}
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="dropping_off"
            checked={isWorkshop}
            onChange={() => {
              setMaterialSource('tailor_choice'); // ✅ Fixed
              setMaterialDropoffDate(''); 
            }}
            className="sr-only"
          />
          <div className={`h-48 border-2 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isWorkshop ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : 'border-stone-300 hover:border-blue-300'}`}>
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${isWorkshop ? 'bg-gradient-to-br from-blue-400 to-indigo-400' : 'bg-stone-200'}`}>
              <svg className={`w-10 h-10 ${isWorkshop ? 'text-white' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-stone-800 mb-2">No, use workshop materials</h4>
            <p className="text-stone-600 font-medium mb-4">Skip date picker</p>
          </div>
        </label>
      </div>

      {isDroppingOff && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl animate-fade-in-up">
          <label className="block text-sm font-semibold text-emerald-800 mb-4">
            📅 Drop-off Date <span className="text-amber-600">*</span>
          </label>
          <input
            type="date"
            value={materialDropoffDate}
            onChange={(e) => setMaterialDropoffDate(e.target.value)}
            min={today}
            className="w-full max-w-md rounded-2xl border-2 border-emerald-300 px-6 py-4 text-lg font-semibold text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg bg-white"
            required
          />
        </div>
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
