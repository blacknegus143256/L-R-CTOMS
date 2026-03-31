import React from 'react';

export default function OrderSummary({ 
  service, 
  shop, 
  auth,
  styleTag, 
  materialSource, 
  measurementType, 
  materialDropoffDate,
  notes, 
  selectedAttributes, 
  designImagePreview, 
  totalPrice, 
  onSubmit,
  loading,
  profileComplete,
  onBack
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const isSewing = categorySlug.includes('custom-sewing') || categorySlug.includes('formal-wear');

  const detailedOptions = selectedAttributes.map(id => {
    const attr = shop?.attributes?.find(a => a.id === id);
    return {
      name: attr?.name || 'Unknown',
      category: attr?.attribute_category?.name || 'Detail',
      price: Number(attr?.pivot?.price || 0)
    };
  });

  const profileMeasurements = auth.user.profile?.measurements || {};
  const profileSum = Object.values(profileMeasurements).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const isPhoneMissing = !auth.user.profile?.phone;
  const isMapMissing = !auth.user.profile?.latitude;
  const isFitMissing = !isRepair && profileSum === 0;

  const summaryItems = [
    { label: isSewing ? 'Target Style' : 'Issue Description', value: notes },
    { label: 'Service', value: service.service_name + ' - ' + (service.price ? `₱${service.price.toLocaleString()}` : 'Price TBD') },
    { label: 'Material', value: materialSource.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
    { label: 'Drop-off Date', value: materialDropoffDate ? new Date(materialDropoffDate).toLocaleDateString() : 'TBD' },
    ...(measurementType === 'profile' ? [{ label: 'Fit Method', value: 'Profile Measurements' }] : []),
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6 text-center">Order Summary</h3>

      <div className="space-y-6 mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-stone-50 p-6 rounded-2xl border border-stone-200">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-amber-700">{service.service_name.split(' ')[0]?.[0] || 'J'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-black text-stone-900 mb-1 truncate">{service.service_name}</h4>
              <p className="text-stone-600 mb-2">{service.service_category?.name}</p>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                isRepair ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isRepair ? 'Repair Order' : 'Bespoke Order'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-sm text-stone-500 block mb-1">{item.label}</span>
              <span className="font-semibold text-stone-900 block truncate">{item.value || 'Not specified'}</span>
            </div>
          ))}
        </div>

        {designImagePreview && (
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h5 className="font-semibold mb-2 text-stone-800">Reference Image</h5>
            <img src={designImagePreview} alt="Design reference" className="w-full max-h-48 rounded-lg object-cover shadow-md" />
          </div>
        )}

{detailedOptions.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-semibold text-stone-800 border-b border-stone-200 pb-2">Customization Breakdown</h5>
            {detailedOptions.map((option, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="px-2 py-1 bg-gray-200 text-xs font-medium text-gray-800 rounded-full">[ {option.category} ]</span>
                <span className="font-bold text-stone-800 flex-1 px-4">{option.name}</span>
                <span className="text-emerald-600 font-bold">+₱{option.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>


        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl mb-8">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-800">Total</span>
            <span className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent tracking-tight">
              ₱{totalPrice?.toLocaleString() || '0.00'}
            </span>
          </div>
          <p className="text-sm text-amber-700 mt-1">Includes service + options. Final price confirmed at fitting.</p>
        </div>

        {/* Smart Guard Checklist */}
        <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl mb-8 shadow-lg">
          <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Pre-Order Checklist
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 {isPhoneMissing ? 'border-amber-400' : 'border-emerald-400'}">
              <span className="text-xl font-bold {isPhoneMissing ? 'text-amber-600' : 'text-emerald-600'}">{isPhoneMissing ? '❌' : '✅'}</span>
              <span className="text-sm font-medium {isPhoneMissing ? 'text-amber-900' : 'text-emerald-900'}">{isPhoneMissing ? 'Missing Contact Number' : 'Phone Verified'}</span>
              {isPhoneMissing && <button className="ml-auto px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700" onClick={() => {}}>Add Phone</button>}
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 {isMapMissing ? 'border-amber-400' : 'border-emerald-400'}">
              <span className="text-xl font-bold {isMapMissing ? 'text-amber-600' : 'text-emerald-600'}">{isMapMissing ? '❌' : '✅'}</span>
              <span className="text-sm font-medium {isMapMissing ? 'text-amber-900' : 'text-emerald-900'}">{isMapMissing ? 'Home Location not pinned' : 'Location Verified'}</span>
              {isMapMissing && <button className="ml-auto px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700" onClick={() => {}}>Pin Map</button>}
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 {isFitMissing ? 'border-amber-400' : 'border-emerald-400'}">
              <span className="text-xl font-bold {isFitMissing ? 'text-amber-600' : 'text-emerald-600'}">{isFitMissing ? '❌' : '✅'}</span>
              <span className="text-sm font-medium {isFitMissing ? 'text-amber-900' : 'text-emerald-900'}">{isFitMissing ? 'Missing Body Measurements' : 'Body Measurements Complete'}</span>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-3 text-center font-medium">
            Complete all items before submitting your Job Card
          </p>
        </div>


      <div className="flex gap-3 pt-4 border-t border-stone-200">

        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50"
        >
          ← Back to Fit
        </button>
        <button
          onClick={onSubmit}
          disabled={isPhoneMissing || isMapMissing || isFitMissing || loading}
          className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 font-bold text-xl text-white hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-2xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5 Ascent 5.373 0 0 5.373 0 12h4zm2 Ascent 5.291A7.962 7 Ascent 4 12H0c0  Ascent 3.042 Ascent 1.135 Ascent 5.824 Ascent 3 Ascent 7.938l3-2.647z"></path>
              </svg>
              Creating Job Card...
            </>
          ) : (
            '✅ Confirm & Submit Order'
          )}
        </button>
      </div>
      {(isPhoneMissing || isMapMissing || isFitMissing) && (
        <p className="text-sm text-rose-600 mt-2 text-center font-medium">
          Please complete the checklist above to enable ordering.
        </p>
      )}
    </div>
  );
}
