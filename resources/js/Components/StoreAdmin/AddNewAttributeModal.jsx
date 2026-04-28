import Modal from '@/Components/Modal';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { getImageUploadError } from '@/utils/imageUpload';

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
    const filteredTypes = attributeTypes.filter(
        type => Number(type.attribute_category_id) === Number(targetCategoryId || 0)
    );
    const [imageError, setImageError] = useState('');

    const handleImageChange = (file) => {
        if (!file) {
            setImageError('');
            setData('image', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setImageError(error);
            setData('image', null);
            return;
        }

        setImageError('');
        setData('image', file);
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-6 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-emerald-200/50">
                <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Add {categoryName} Item
                </h2>

                {/* IMAGE UPLOAD */}
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Product Image
                    </label>
                    <div className="relative mt-1 border-2 border-dashed border-emerald-300 rounded-xl p-6 bg-emerald-50/50 hover:border-emerald-400 transition-all cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => handleImageChange(e.target.files[0] || null)}
                        />
                        {data.image ? (
                            <div className="flex items-center gap-3 text-emerald-700">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 flex-shrink-0">
                                    <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-sm truncate max-w-[200px]">{data.image.name}</span>
                            </div>
                        ) : (
                            <div className="text-center text-emerald-600">
                                <Plus className="w-12 h-12 mx-auto mb-2 opacity-60" />
                                <p className="font-semibold">Click to upload</p>
                                <p className="text-xs text-emerald-500 mt-1">JPEG, PNG up to 2MB</p>
                            </div>
                        )}
                        {imageError && <p className="mt-2 text-xs font-semibold text-rose-600">{imageError}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* ATTRIBUTE TYPE */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            {categoryName} Type *
                        </label>
                        <select
                            className="w-full border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={data.attribute_type_id || ''}
                            onChange={e => setData('attribute_type_id', e.target.value)}
                            required
                        >
                            <option value="">Select Type</option>
                            {filteredTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PRICE */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Price (₱)
                        </label>
                        <input
                            type="number"
                            className="w-full border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={data.price || ''}
                            onChange={e => setData('price', e.target.value)}
                            placeholder="250.00"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                {/* ITEM NAME */}
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Item Name / Details *
                    </label>
                    <input
                        type="text"
                        className="w-full border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                        value={data.item_name || ''}
                        onChange={e => setData('item_name', e.target.value)}
                        placeholder="e.g., Blue Floral Cotton V-Neck"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* UNIT */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Unit
                        </label>
                        <select
                            className="w-full border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={data.unit || 'per piece'}
                            onChange={e => setData('unit', e.target.value)}
                        >
                            <option value="per meter">Per Meter</option>
                            <option value="per yard">Per Yard</option>
                            <option value="per piece">Per Piece (e.g., T-Shirts, Buttons)</option>
                            <option value="per set">Per Set</option>
                        </select>
                    </div>

                    {/* AVAILABILITY */}
                    <div className="flex items-center pt-1">
                        <input
                            type="checkbox"
                            id="is_available"
                            checked={data.is_available !== false}
                            onChange={e => setData('is_available', e.target.checked)}
                            className="h-5 w-5 text-emerald-600 border-stone-200 focus:ring-emerald-500 rounded-xl shadow-sm"
                        />
                        <label htmlFor="is_available" className="ml-3 text-sm font-semibold text-slate-700 select-none">
                            Available
                        </label>
                    </div>
                </div>

                {/* NOTES */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        className="w-full border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm resize-vertical"
                        value={data.notes || ''}
                        onChange={e => setData('notes', e.target.value)}
                        rows="3"
                        placeholder="Special notes..."
                    />
                </div>

                {/* ACTIONS - tighter */}
                <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200/50">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all text-sm"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing || Boolean(imageError)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold px-8 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-400/50 hover:scale-[1.02] transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>
            </form>
        </Modal>
    );
}
