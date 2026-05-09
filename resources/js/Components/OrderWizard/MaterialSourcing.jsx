import React from 'react';
import { Info, UserRound, ShoppingBag, CheckCircle2, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const [expandedCategories, setExpandedCategories] = React.useState({});

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h3 className="text-xl font-bold text-stone-800 mb-6">Material Selection</h3>

      {/* Move 1: The Handshake Info Card */}
      <div className="mb-8 p-6 bg-stone-900/5 border border-stone-200 rounded-3xl backdrop-blur-md">
          <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-600" />
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
              <UserRound className="w-8 h-8 text-stone-600" />
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
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
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
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryName)}
                    className="w-full flex items-center justify-between gap-3 mb-4 text-left"
                  >
                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">
                      {categoryName}
                    </h4>
                    <span className="text-[10px] font-black uppercase text-stone-500 flex items-center gap-1">
                      <ChevronRight className={`w-3 h-3 transition-transform ${expandedCategories[categoryName] ? 'rotate-90' : ''}`} />
                      {expandedCategories[categoryName] ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {expandedCategories[categoryName] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {items.map(attr => {
                      const uniqueId = attr.pivot?.id;
                      const isSelected = selectedAttributes.includes(uniqueId);

                      let displayName = attr.pivot?.item_name || attr.name || 'Shop Item';
                      const price = Number(attr.pivot?.price || attr.price || 0);
                      const unit = attr.pivot?.unit || attr.unit || 'unit';
                      const categoryName = attr.attributeCategory?.name || attr.attribute_category?.name || 'Option';

                      if (displayName.includes(' - ')) {
                        const parts = displayName.split(' - ');
                        if (parts[0].trim() === parts[1].trim()) displayName = parts[0].trim();
                      }

                      const imageSource = attr.pivot?.image_url || attr.image_url;

                      return (
                        <div key={uniqueId} className="flex flex-col gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => toggleAttribute(uniqueId)}
                            className={`p-3 rounded-2xl border-2 transition-all w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                : 'border-stone-100 hover:border-indigo-200 bg-white'
                            }`}
                          >
                            {imageSource ? (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm bg-white">
                                <img src={`/storage/${imageSource}`} alt={displayName} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-[10px] font-black uppercase text-stone-400">
                                <ImageOff className="w-5 h-5" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0 text-left">
                              <span className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                                {categoryName}
                              </span>
                              <span className="block font-black text-stone-800 text-base sm:text-lg leading-tight mb-2 truncate">
                                {displayName}
                              </span>
                              {price > 0 ? (
                                <span className="inline-flex text-sm font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                  +₱{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                                  <span className="text-emerald-600/70 font-bold text-xs">per {unit}</span>
                                </span>
                              ) : (
                                <span className="inline-flex text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                                  Included
                                </span>
                              )}
                            </div>

                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-stone-300'}`}>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
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
                  )}
                </div>
              ))}
            </div>
          );
        })()
      )}

      {/* Success Message for "Own Material" */}
      {materialSource === 'customer' && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
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
          <span className="inline-flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all"
        >
          <span className="inline-flex items-center justify-center gap-2">Next: Drop-off Date <ChevronRight className="w-4 h-4" /></span>
        </button>
      </div>
    </div>
  );
}

