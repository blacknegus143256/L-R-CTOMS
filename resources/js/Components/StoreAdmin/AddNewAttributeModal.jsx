import Modal from '@/Components/Modal';
import { Plus } from 'lucide-react';


export default function AddNewAttributeModal({
    isOpen,
    onClose,
    targetCategoryId,
    categories,
    attributeTypes = [],
    data,
    setData,
    onSubmit,
    processing
}) {
    const category = categories?.find(c => c.id === targetCategoryId);
    const categoryName = category?.name || '';
    // Filter types belonging to this category
    const filteredTypes = attributeTypes.filter(
        type => Number(type.attribute_category_id) === Number(targetCategoryId || 0)
    );

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-8 bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-emerald-200/50">
                <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent mb-6">
                    Add New {categoryName} Item
                </h2>

                {/* ATTRIBUTE TYPE DROPDOWN */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {categoryName} Type *
                    </label>
                    <select
                        className="w-full mt-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 text-slate-800"
                        value={data.attribute_type_id || ''}
                        onChange={e => setData('attribute_type_id', e.target.value)}
                        required
                    >
                        <option value="">Select {categoryName} Type</option>
                        {filteredTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ITEM NAME */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Item Name / Details *
                    </label>
                    <input
                        type="text"
                        className="w-full mt-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 text-slate-800"
                        value={data.item_name || ''}
                        onChange={e => setData('item_name', e.target.value)}
                        placeholder="e.g., Blue Floral Cotton V-Neck"
                        required
                    />
                </div>

                {/* PRICE */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Price (₱)
                    </label>
                    <input
                        type="number"
                        className="w-full mt-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 text-slate-800"
                        value={data.price || ''}
                        onChange={e => setData('price', e.target.value)}
                        placeholder="250.00"
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* UNIT */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Unit
                    </label>
                    <select
                        className="w-full mt-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 text-slate-800"
                        value={data.unit || 'per piece'}
                        onChange={e => setData('unit', e.target.value)}
                    >
                        <option value="per yard">per yard</option>
                        <option value="per meter">per meter</option>
                        <option value="per piece">per piece</option>
                        <option value="per set">per set</option>
                        <option value="per inch">per inch</option>
                    </select>
                </div>

                {/* NOTES */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        className="w-full mt-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 text-slate-800 resize-vertical"
                        value={data.notes || ''}
                        onChange={e => setData('notes', e.target.value)}
                        rows={3}
                        placeholder="Special supplier info, quality notes, etc..."
                    />
                </div>

                {/* AVAILABILITY */}
                <div className="mt-6 flex items-center">
                    <input
                        type="checkbox"
                        id="is_available"
                        checked={data.is_available !== false}
                        onChange={e => setData('is_available', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 border-stone-200 focus:ring-emerald-500 rounded-xl shadow-sm"
                    />
                    <label htmlFor="is_available" className="ml-3 text-lg font-bold text-slate-700 select-none">
                        Available for customers
                    </label>
                </div>

                {/* ACTIONS */}
                <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-emerald-200/30">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-8 py-4 text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-300 shadow-md hover:shadow-slate-200"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center gap-2 text-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Add to Inventory
                    </button>
                </div>
            </form>
        </Modal>
    );
}

