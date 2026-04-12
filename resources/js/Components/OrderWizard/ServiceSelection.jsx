import React from 'react';

export default function ServiceSelection({ shop, onServiceSelect, disabled = false }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6 text-center">Step 1: Choose Your Service</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shop.services.map((service) => (
          <div
            key={service.id}
            className="group cursor-pointer border-2 border-stone-200 rounded-2xl p-6 hover:border-amber-400 hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-stone-50"
            onClick={() => !disabled && onServiceSelect(service.id)}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 14.333a2.667 2.667 0 100-5.333 2.667 2.667 0 000 5.333z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-stone-800 mb-2 text-center group-hover:text-amber-700 transition-colors">{service.service_name}</h4>
<div className="text-2xl font-black text-amber-600 mb-3 text-center">Starts at ₱{Number(service.price || 0).toLocaleString()}*</div>
            <div className="text-sm text-stone-600 mb-4 text-center">{service.service_category?.name}</div>
            <div className="flex items-center justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${disabled ? 'bg-stone-200 text-stone-500 cursor-not-allowed' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}>
                {disabled ? 'Loading...' : 'Select Service'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-stone-500 mt-6 italic">
         * The prices listed above cover the base labor cost. The final total may vary depending on the materials, fabrics, and customizations you select in the following steps.
      </p>
      {disabled && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <div className="text-amber-800 font-medium">Loading services...</div>
        </div>
      )}
    </div>
  );
}
