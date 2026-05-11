import React from 'react';
import { format } from 'date-fns';

export default function OrderSummary({ 
  service, 
  shop, 
  auth,
  styleTag, 
  materialSource, 
  measurementPreference, 
  measurementDate, 
  measurementTime,
  materialDropoffDate,
  materialDropoffTime,
  notes, 
  isRush,
  quantity,
  setQuantity,
  selectedAttributes, 
  attributeQuantities,
  designImagePreview, 
  totalPrice, 
  onSubmit,
  loading,
  onBack
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const isCustomQuote = service.checkout_type === 'requires_quote';

  // No attributes display needed in summary - handled by totalPrice

  const formatDateTime = (dateValue, timeValue) => {
    if (!dateValue) return 'TBD';

    const dateOnly = String(dateValue).split('T')[0];
    const formattedDate = format(new Date(`${dateOnly}T00:00:00`), 'MMMM d, yyyy');

    if (!timeValue) {
      return formattedDate;
    }

    const formattedTime = format(new Date(`1970-01-01T${timeValue}`), 'hh:mm a');
    return `${formattedDate} at ${formattedTime}`;
  };

  const normalizedQuantity = Math.max(1, Number(quantity) || 1);

  const handleQuantityInput = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.max(1, parsed));
  };

  const summaryItems = [
    { label: 'Notes', value: notes },
    { label: 'Service', value: service.service_name + ' - ' + (service.price ? `₱${service.price.toLocaleString()}` : 'Price TBD') },
    { label: 'Material', value: materialSource?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
    ...(service?.rush_service_available
      ? [{ label: 'Rush Order', value: isRush ? 'Yes (subject to additional fee)' : 'No' }]
      : []),
    ...(materialSource === 'customer'
      ? [{ label: 'Drop-off Schedule', value: formatDateTime(materialDropoffDate, materialDropoffTime) }]
      : []),
{ 
    label: 'Fit Method', 
    value: (measurementPreference === 'none' || !measurementPreference)
        ? 'No Measurements Required' 
        : (measurementPreference === 'self_measure' || measurementPreference === 'self_measured' || measurementPreference === 'profile'
            ? 'I will provide measurements'
            : measurementPreference === 'home_visit'
              ? 'Home Visit'
              : 'In-Shop Fitting') 
},
    ...(['in_shop', 'home_visit', 'workshop_fitting'].includes(measurementPreference)
      ? [{
          label: 'Fitting Schedule',
          value: formatDateTime(measurementDate || materialDropoffDate, measurementTime || materialDropoffTime),
        }]
      : []),
  ];

  return (
    <div className="p-6 relative">
      <div className="mb-8">
        <h3 className="text-3xl font-black text-stone-900 mb-2">Order Summary</h3>
        <p className="text-stone-500">Review your order details before submitting</p>
      </div>

      <div className="space-y-8 mb-8">
        {/* Main Service Card */}
        <div className="bg-white border-2 border-stone-200 rounded-3xl overflow-hidden hover:border-indigo-300 transition-colors">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-2xl font-black text-indigo-600">{service.service_name.split(' ')[0]?.[0] || 'S'}</span>
              </div>
              <div className="flex-1 min-w-0 text-white">
                <h4 className="text-xl font-black mb-1">{service.service_name}</h4>
                <p className="text-indigo-100 text-sm font-medium">{service.service_category?.name}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-stone-600 font-medium">Service Price</span>
              <span className="text-2xl font-black text-indigo-600">
                {service.price ? `₱${service.price.toLocaleString()}` : 'Price TBD'}
              </span>
            </div>
            
            {isRepair && (
              <div className="pt-4 border-t border-stone-100">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  Repair Service
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6">
          <h5 className="text-sm font-black text-stone-500 uppercase tracking-wider mb-5">Order Details</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summaryItems.map((item, idx) => (
              <div key={idx} className="pb-6 border-b border-stone-100 md:border-0 last:border-0">
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block mb-2">{item.label}</span>
                <span className="text-stone-900 font-semibold block text-base">{item.value || 'Not specified'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requested Attributes & Items */}
        {selectedAttributes.length > 0 && (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-stone-200">
              <h5 className="text-sm font-black text-stone-700 uppercase tracking-wider">Add-ons & Customizations</h5>
              <p className="text-stone-500 text-xs mt-1">{selectedAttributes.length} item{selectedAttributes.length !== 1 ? 's' : ''} selected</p>
            </div>
            <div className="divide-y divide-stone-100">
{selectedAttributes.map((attrId) => {
  const attr = shop?.attributes?.find(a => a.pivot?.id == attrId);
  if (!attr) return null;

  const category = attr.attribute_category?.name || 'Specification';
  const qty = attributeQuantities[attrId] || 1;
  const unit = attr.pivot?.unit || 'unit';
  const unitPrice = Number(attr.pivot?.price || 0);
  const lineTotal = unitPrice * qty * normalizedQuantity;

  return (
<div key={attrId} className="p-5 hover:bg-stone-50 transition-colors">
    <div className="flex gap-4 mb-3">
        {attr.pivot?.image_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 flex-shrink-0 shadow-sm">
                <img src={`/storage/${attr.pivot.image_url}`} alt={attr.pivot?.item_name || attr.name} className="w-full h-full object-cover" />
            </div>
        ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-black text-stone-400">
                No Image
            </div>
        )}
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-purple-600 tracking-wider">
                {category}
              </span>
              <span className="text-base font-black text-indigo-600">₱{lineTotal.toFixed(2)}</span>
            </div>
            <span className="text-base font-bold text-stone-900 block mb-1">
                {attr.pivot?.item_name || attr.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2 py-1 rounded-lg">
                ₱{unitPrice.toFixed(2)}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {qty} {unit}
              </span>
              <span className="text-xs text-stone-400">
                x {normalizedQuantity}
              </span>
            </div>
        </div>
    </div>
</div>
  );
})}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-3xl mb-8 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col gap-6">
            {/* Quantity Section */}
            <div className="flex items-center justify-between pb-6 border-b border-indigo-200">
              <div>
                <span className="text-sm font-black uppercase tracking-wider text-indigo-700 block">Order Quantity</span>
                <p className="text-xs text-indigo-600 mt-1">How many times would you like this order made?</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-indigo-300 bg-white px-3 py-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, normalizedQuantity - 1))}
                  className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 font-black hover:bg-indigo-200 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={normalizedQuantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  className="h-9 w-16 rounded-lg border border-indigo-200 text-center font-bold text-stone-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  aria-label="Order quantity"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(normalizedQuantity + 1)}
                  className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 font-black hover:bg-indigo-200 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Section */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-stone-700 uppercase tracking-wider">Total Amount</span>
                <span className="text-5xl font-black text-indigo-600 tracking-tight">
                  {isCustomQuote ? 'Quote' : `₱${totalPrice?.toLocaleString() || '0.00'}`}
                </span>
              </div>
              {!isCustomQuote && (
                <div className="flex items-center justify-end text-sm text-indigo-600 font-medium">
                  <span>Per order: ₱{(service.price || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {isCustomQuote && (
              <div className="bg-amber-100 border border-amber-300 rounded-2xl p-4 mt-2">
                <p className="text-sm text-amber-900 font-medium">
                  Custom Request: Your design and materials will be reviewed by the tailor, who will provide an exact quote for your approval before starting work.
                </p>
              </div>
            )}
            {isRush && (
              <div className="bg-red-100 border border-red-300 rounded-2xl p-4 mt-2">
                <p className="text-sm text-red-900 font-medium">
                  Rush Order Requested: Your order may incur a rush surcharge based on shop availability and policies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-stone-200">
        <button 
          type="button" 
          onClick={onBack} 
          className="flex-1 rounded-xl border-2 border-stone-300 py-4 px-6 font-bold text-stone-700 text-lg hover:bg-stone-50 hover:border-stone-400 transition-all"
        >
          Back to Review
        </button>
        <button 
          type="button"
          onClick={onSubmit} 
          disabled={loading} 
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-black text-lg text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Processing Order...' : (isCustomQuote ? 'Request a Quote' : 'Confirm & Place Order')}
        </button>
      </div>
    </div>
  );
}
