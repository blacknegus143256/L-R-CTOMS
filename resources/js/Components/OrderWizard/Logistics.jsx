import React from 'react';

export default function Logistics({ 
  service,
  materialDropoffDate,
  setMaterialDropoffDate,
  materialSource,
  setMaterialSource,
  onNext,
  onBack,
  canNext
}) {
  if (!service) return null;

  const isDroppingOff = materialSource === 'customer';

  // Strictly require date only if dropping off
  const effectiveCanNext = !isDroppingOff || !!materialDropoffDate;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Drop-off Logistics</h3>

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

      {materialSource === 'customer' ? (
        <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl">
          <p className="text-lg font-semibold text-emerald-800 mb-4">
            Since you are providing your own materials, please schedule a drop-off date below.
          </p>
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl animate-fade-in-up">
            <label className="block text-sm font-semibold text-emerald-800 mb-4">
              📅 Drop-off Date <span className="text-amber-600">*</span>
            </label>
            <input
              type="date"
              value={materialDropoffDate}
              onChange={(e) => setMaterialDropoffDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full max-w-md rounded-2xl border-2 border-emerald-300 px-6 py-4 text-lg font-semibold text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg bg-white"
              required
            />
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl text-center">
          <span className="text-4xl mb-4 block">✅</span>
          <h4 className="text-xl font-bold text-emerald-800 mb-3">Workshop Materials Selected</h4>
          <p className="text-lg text-emerald-700 font-medium">No material drop-off is required! You can proceed to the next step.</p>
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
          disabled={!canNext}
          className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 font-bold text-white text-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next: Measurements →
        </button>
      </div>
    </div>
  );
}
