import Modal from '@/components/Modal';
import { useEffect } from 'react';

export default function EditShopAttributeModal({ 
    show, 
    onClose,
    attribute, 
    editAttrData, 
    setEditAttrData, 
    submitEditAttr, 
    processing,
}) {
    useEffect(() => {
        if (!attribute || !show) return;

        setEditAttrData('item_name', attribute.pivot?.item_name || '');
        setEditAttrData('price', attribute.pivot?.price || '');
        setEditAttrData('unit', attribute.pivot?.unit || 'per piece');
        setEditAttrData('notes', attribute.pivot?.notes || '');
        setEditAttrData('is_available', attribute.pivot?.is_available ?? false);

    }, [attribute?.id, show]);

    if (!attribute) return null;

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submitEditAttr} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Edit {attribute.name}
                </h2>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Item Name / Details</label>
                    <input 
                        type="text" 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={editAttrData.item_name || ''}
                        onChange={e => setEditAttrData('item_name', e.target.value)}
                        placeholder="(eg. Blue Floral Pattern)"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Price (₱)</label>
                    <input 
                        type="number" 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={editAttrData.price}
                        onChange={e => setEditAttrData('price', e.target.value)}
                        required
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Unit</label>
                    <select 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={editAttrData.unit}
                        onChange={e => setEditAttrData('unit', e.target.value)}
                    >
                        <option value="per yard">per yard</option>
                        <option value="per meter">per meter</option>
                        <option value="per piece">per piece</option>
                        <option value="per set">per set</option>
                        <option value="per inch">per inch</option>
                    </select>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Notes (Optional)</label>
                    <textarea 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={editAttrData.notes || ''}
                        onChange={e => setEditAttrData('notes', e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                    />
                </div>

                <div className="mt-4 flex items-center">
                    <input 
                        type="checkbox" 
                        id="is_available"
                        checked={editAttrData.is_available}
                        onChange={e => setEditAttrData('is_available', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                        Available for customers
                    </label>
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className="mr-3 text-gray-600">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}
