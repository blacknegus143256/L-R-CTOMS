import React from 'react';

export default function ServiceSelection({ shop, onServiceSelect, disabled = false }) {
  return (
    <div className="p-6">
<div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0 shadow-inner">
        {(shop.logo_url || shop.user?.profile?.avatar_url) ? (
            <img src={`/storage/${shop.logo_url || shop.user?.profile?.avatar_url}`} alt="Shop Logo" className="w-full h-full object-cover" />
        ) : (
            <span className="text-xl font-black text-stone-300 uppercase">
                {(shop.user?.name || shop.shop_name || 'S').charAt(0)}
            </span>
        )}
    </div>
    <div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            {shop.shop_name}
        </h2>
        <p className="text-stone-500 font-medium text-sm">
            Select a service to begin your order
        </p>
    </div>
</div>
<h3 className="text-lg font-semibold mb-6 text-center">Step 1: Choose Your Service</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shop.services.map((service) => (
          <div
            key={service.id}
            className="relative group cursor-pointer border-2 border-stone-200 rounded-2xl p-6 hover:border-amber-400 hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-stone-50"
            onClick={() => !disabled && onServiceSelect(service.id)}
          >
            
            {/* Service Image Banner */}
            <div className="h-32 mx-auto mb-4 relative bg-stone-100 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform">
              <img 
                src={(service.image || service.image_url || service.service_image) ? ((service.image || service.image_url || service.service_image).startsWith('http') ? (service.image || service.image_url || service.service_image) : `/storage/${service.image || service.image_url || service.service_image}`) : '/images/default-service.jpg'} 
                alt={service.service_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '/images/default-service.jpg';
                }}
              />
              <div className="absolute top-4 right-4">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${service.checkout_type === 'fixed_price' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {service.checkout_type === 'fixed_price' ? 'Fixed Price' : 'Based On Design'}
                </span>
            </div>
              <div className="absolute top-3 left-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/30">
                  {service.service_category?.name || 'Service'}
                </span>
              </div>
            </div>
            <h4 className="text-xl font-bold text-stone-800 mb-2 text-center group-hover:text-amber-700 transition-colors">{service.service_name}</h4>
            <div className="text-2xl font-black text-amber-600 mb-3 text-center">
              {service.checkout_type === 'fixed_price' ? `₱${Number(service.price || 0).toLocaleString()}` : `Starts at ₱${Number(service.price || 0).toLocaleString()}*`}
            </div>
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
