import React from 'react';

const iconFor = (category) => {
    if (!category) return '🧵';
    if (category.includes('Gown') || category.includes('Dress')) return '👗';
    if (category.includes('Suit')) return '👔';
    if (category.includes('Hemming') || category.includes('Repair')) return '✂️';
    if (category.includes('Embroidery')) return '🪡';
    return '🧵';
};

export default function ServiceCategoryPills({ categories, selected, toggle }) {
    if (!categories?.length) return null;

    return (
        <div className="w-full border-y border-stone-200 bg-white sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold text-stone-500 uppercase self-center shrink-0">Services</span>
                {categories.map((category) => {
                    const active = selected.includes(category);
                    return (
                        <button
                            key={category}
                            onClick={() => toggle(category)}
                            className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                active ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                        >
                            <span>{iconFor(category)}</span>
                            <span>{category}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

