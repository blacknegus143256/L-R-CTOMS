import React from 'react';

export default function DesignContext({ 
  service, 
  styleTag, 
  setStyleTag, 
  designImagePreview, 
  setDesignImageFile, 
  handleDesignImage, 
  styleAttrs, 
  notes, 
  setNotes,
  error,
  onNext,
  canNext,
  onBack,
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const serviceName = service.service_name || '';

  const getStyleLabel = () => {
    const name = service?.service_name?.toLowerCase() || '';
    if (name.includes('shirt')) return "Shirt Style (Neckline/Sleeve)";
    if (name.includes('trouser') || name.includes('pants')) return "Leg Cut & Silhouette";
    if (name.includes('gown') || name.includes('dress')) return "Gown/Suit Silhouette";
    return "Design Style";
  };

  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const isSewing = categorySlug.includes('custom-sewing') || categorySlug.includes('formal-wear');

  const filteredStyleAttrs = styleAttrs.filter(attr => {
    const attrName = attr.name.toLowerCase();
    const lowerServiceName = serviceName.toLowerCase();
    if (lowerServiceName.includes('shirt') || lowerServiceName.includes('t-shirt')) {
      return attrName.includes('top') || attrName.includes('neck') || attrName.includes('sleeve');
    }
    if (lowerServiceName.includes('trouser') || lowerServiceName.includes('pants')) {
      return attrName.includes('leg') || attrName.includes('bottom') || attrName.includes('waist');
    }
    return true;
  });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">{isRepair ? 'Damage Details' : 'Design Context'}</h3>

      {error && !canNext && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="mb-2">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Design Notes <span className="text-amber-600">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0,500))}
            placeholder="Describe your vision in detail - fabric feel, silhouette, special details, inspiration... (500 chars max)"
            rows={6}
            maxLength={500}
            className="w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-vertical min-h-[140px] font-medium"
            required
          />
          <div className="text-right mt-1">
            <span className={`text-sm ${notes.length > 450 ? 'text-red-600 font-bold' : 'text-stone-500'}`}>
              {notes.length}/500
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Reference Photo (recommended)
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleDesignImage}
              className="w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 block w-full text-sm text-stone-500 hover:file:cursor-pointer"
            />
            {designImagePreview && (
              <div className="flex gap-3 items-center">
                <img src={designImagePreview} alt="Preview" className="flex-1 max-h-48 rounded-lg shadow-md object-cover" />
                <button
                  type="button"
onClick={() => handleDesignImage({ target: { files: [] } })}
                  className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all flex-shrink-0 whitespace-nowrap"
                >
                  Clear Image
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200">
          <div className="flex gap-3">
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
              className="flex-1 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRepair ? 'Continue to Drop-off' : 'Next: Materials'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

