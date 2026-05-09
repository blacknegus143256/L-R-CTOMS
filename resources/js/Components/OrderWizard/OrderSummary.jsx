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

        {/* Requested Attributes & Items */}
        {selectedAttributes.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-3">Requested Add-ons</span>
            <div className="flex flex-col gap-2">
{selectedAttributes.map((attrId) => {
  const attr = shop?.attributes?.find(a => a.pivot?.id == attrId);
  if (!attr) return null;

  const category = attr.attribute_category?.name || 'Specification';
  const qty = attributeQuantities[attrId] || 1;
  const unit = attr.pivot?.unit || 'unit';
  const unitPrice = Number(attr.pivot?.price || 0);
  const lineTotal = unitPrice * qty * normalizedQuantity;

  return (
<div key={attrId} className="flex justify-between items-center py-4 border-b border-stone-100 last:border-0 gap-4">
    <div className="flex items-center gap-4">
        {attr.pivot?.image_url ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0 shadow-sm">
                <img src={`/storage/${attr.pivot.image_url}`} alt={attr.pivot?.item_name || attr.name} className="w-full h-full object-cover" />
            </div>
        ) : (
            <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-stone-300">
                N/A
            </div>
        )}
        <div>
            <span className="text-[10px] font-black uppercase text-indigo-500 block leading-none mb-1.5 tracking-wider">
                {category} • {attr.name}
            </span>
            <span className="text-base font-bold text-stone-800 block mb-1">
                {attr.pivot?.item_name || attr.name}
            </span>
            <span className="text-xs text-stone-500 block font-bold">
              ₱{unitPrice.toFixed(2)} x {qty} {unit} x {normalizedQuantity} order{normalizedQuantity > 1 ? 's' : ''}
            </span>
        </div>
    </div>
    <span className="text-lg font-black text-stone-800 flex-shrink-0">₱{lineTotal.toFixed(2)}</span>
</div>
  );
})}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-amber-800">Quantity</span>
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, normalizedQuantity - 1))}
                className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 font-black hover:bg-amber-200"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={normalizedQuantity}
                onChange={(e) => handleQuantityInput(e.target.value)}
                className="h-8 w-16 rounded-lg border border-amber-200 text-center font-bold text-stone-900 focus:border-amber-500 focus:outline-none"
                aria-label="Order quantity"
              />
              <button
                type="button"
                onClick={() => setQuantity(normalizedQuantity + 1)}
                className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 font-black hover:bg-amber-200"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-800">Total</span>
            <span className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
              {isCustomQuote ? 'TBD by Tailor' : `₱${totalPrice?.toLocaleString() || '0.00'}`}
            </span>
          </div>
          {isCustomQuote && (
            <div className="mt-2 flex gap-2 items-start bg-amber-100/50 p-3 rounded-lg border border-amber-200/50">
              <span className="text-amber-600 mt-0.5">ℹ️</span>
              <p className="text-sm text-amber-800 font-medium">
                This is a custom request. Your design and materials will be reviewed by the tailor, who will provide an exact labor and materials quote for your approval before starting.
              </p>
            </div>
          )}
          {isRush && (
            <div className="mt-2 flex gap-2 items-start bg-rose-100/60 p-3 rounded-lg border border-rose-200/70">
              <span className="text-rose-600 mt-0.5">⚠️</span>
              <p className="text-sm text-rose-800 font-medium">
                Rush requested: final quote may include a rush surcharge based on shop policy.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50">← Back</button>
        <button 
          type="button"
          onClick={onSubmit} 
          disabled={loading} 
          className="flex-1 rounded-lg bg-emerald-600 px-8 py-4 font-bold text-xl text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isCustomQuote ? '📝 Request a Quote' : '✅ Confirm & Submit Order')}
        </button>
      </div>
    </div>
  );
}
