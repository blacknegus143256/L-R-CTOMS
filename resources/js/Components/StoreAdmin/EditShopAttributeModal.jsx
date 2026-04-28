import Modal from '@/Components/Modal';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getImageUploadError } from '@/utils/imageUpload';

export default function EditShopAttributeModal({ 
    show, 
    onClose,
    attribute, 
    editAttrData, 
    setEditAttrData, 
    submitEditAttr, 
    processing,
}) {
    const [imageError, setImageError] = useState('');

    useEffect(() => {
        if (!attribute || !show) return;

        setEditAttrData('item_name', attribute.pivot?.item_name || '');
        setEditAttrData('price', attribute.pivot?.price || '');
        setEditAttrData('unit', attribute.pivot?.unit || 'per piece');
        setEditAttrData('notes', attribute.pivot?.notes || '');
        setEditAttrData('image', null);
        setEditAttrData('is_available', attribute.pivot?.is_available ?? false);
        setImageError('');
    }, [attribute?.id, show]);

    const handleImageChange = (file) => {
        if (!file) {
            setImageError('');
            setEditAttrData('image', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setImageError(error);
            setEditAttrData('image', null);
            return;
        }

        setImageError('');
        setEditAttrData('image', file);
    };

    if (!attribute) return null;

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submitEditAttr} className="p-6 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-emerald-200/50">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Edit {attribute.name}
                </h2>

                {/* IMAGE UPLOAD */}
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Product Image (Optional)
                    </label>
                    <div className="relative mt-1 border-2 border-dashed border-emerald-300 rounded-xl p-4 bg-emerald-50/50 hover:border-emerald-400 transition-all cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => handleImageChange(e.target.files[0] || null)}
                        />
                        {editAttrData.image ? (
                            <div className="flex items-center gap-2 text-emerald-700 text-xs">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-100 flex-shrink-0">
                                    <img src={URL.createObjectURL(editAttrData.image)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold truncate max-w-[150px]">{editAttrData.image.name}</span>
                            </div>
                        ) : (
                            <div className="text-center text-emerald-600 text-xs">
                                <Plus className="w-8 h-8 mx-auto mb-1 opacity-60" />
                                <p className="font-semibold">Upload new image</p>
                                <p className="text-emerald-500">Current: {attribute.pivot?.image_url ? 'Has image' : 'No image'}</p>
                            </div>
                        )}
                        {imageError && <p className="mt-2 text-xs font-semibold text-rose-600">{imageError}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* ITEM NAME */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Item Name / Details
                        </label>
                        <input 
                            type="text" 
                            className="w-full border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={editAttrData.item_name || ''}
                            onChange={e => setEditAttrData('item_name', e.target.value)}
                            placeholder="(e.g., Blue Floral Pattern)"
                        />
                    </div>

                    {/* PRICE */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Price (₱) *
                        </label>
                        <input 
                            type="number" 
                            className="w-full border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={editAttrData.price === 0 ? '' : editAttrData.price}
                            onChange={e => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setEditAttrData('price', val);
                            }}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* UNIT */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Unit
                        </label>
                        <select 
                            className="w-full border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm"
                            value={editAttrData.unit}
                            onChange={e => setEditAttrData('unit', e.target.value)}
                        >
                            <option value="per meter">Per Meter</option>
                            <option value="per yard">Per Yard</option>
                            <option value="per piece">Per Piece (e.g., T-Shirts, Buttons)</option>
                            <option value="per set">Per Set</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* AVAILABILITY */}
                    <div className="flex items-center pt-2">
                        <input 
                            type="checkbox" 
                            id="is_available"
                            checked={editAttrData.is_available}
                            onChange={e => setEditAttrData('is_available', e.target.checked)}
                            className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                        />
                        <label htmlFor="is_available" className="ml-2 text-sm font-semibold text-slate-700">
                            Available
                        </label>
                    </div>

                    {/* NOTES */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea 
                            className="w-full border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 px-3 text-sm resize-vertical"
                            value={editAttrData.notes || ''}
                            onChange={e => setEditAttrData('notes', e.target.value)}
                            placeholder="Any additional notes..."
                            rows="2"
                        />
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-200/50">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all text-sm"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={processing || Boolean(imageError)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2 rounded-xl shadow-lg hover:shadow-emerald-400/50 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Update Item
                    </button>
                </div>
            </form>
        </Modal>
    );
}
