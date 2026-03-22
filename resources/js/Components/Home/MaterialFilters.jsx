import React from 'react';

export default function MaterialFilters({
    categories,
    selectedAttributes,
    selectedServiceCategories,
    toggleAttribute,
    toggleDropdown,
    openDropdowns,
    clearFilters,
}) {
    return (
        <aside className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-stone-800">Materials Filter</h2>
                    {(selectedAttributes.length > 0 || selectedServiceCategories.length > 0) && (
                        <button type="button" onClick={clearFilters} className="text-sm text-amber-600 hover:underline font-medium">
                            Clear All
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {categories.map((cat) => {
                        const attrs = cat.attribute_types || [];
                        const selectedCount = attrs.filter((a) => selectedAttributes.includes(a.id)).length;
                        const isOpen = !!openDropdowns[cat.id];
                        return (
                            <div key={cat.id} className="border border-stone-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleDropdown(cat.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-stone-50 hover:bg-stone-100 transition-colors"
                                >
                                    <span className="font-medium text-stone-700 text-sm">
                                        {cat.name} {selectedCount > 0 && `(${selectedCount})`}
                                    </span>
                                    <svg className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isOpen && (
                                    <div className="p-2 bg-white max-h-48 overflow-y-auto">
                                        {attrs.map((attr) => (
                                            <label key={attr.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-stone-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttributes.includes(attr.id)}
                                                    onChange={() => toggleAttribute(attr.id)}
                                                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="text-sm text-stone-700">{attr.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

