import Modal from '@/components/Modal';
import { useEffect } from 'react';

export default function EditShopAttributeModal({ 
    isOpen, 
    onClose,
    item, 
    pivot, 
    data, 
    setData, 
    onSubmit, 
    processing,
    
}) {
    useEffect(() => {
    if (!pivot || !isOpen) return;

    setData('price', pivot.price ?? '');
    setData('unit', pivot.unit ?? 'per piece');
    setData('notes', pivot.notes ?? '');
    setData('is_available', pivot.is_available ?? false);

}, [item?.id, isOpen]);
    if (!item) return null;

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Edit {item.name}
                </h2>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Price (₱)</label>
                    <input 
                        type="number" 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={data.price}
                        onChange={e => setData('price', e.target.value)}
                        required
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Unit</label>
                    <select 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={data.unit}
                        onChange={e => setData('unit', e.target.value)}
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
                        value={data.notes || ''}
                        onChange={e => setData('notes', e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                    />
                </div>

                <div className="mt-4 flex items-center">
                    <input 
                        type="checkbox" 
                        id="is_available"
                        checked={data.is_available}
                        onChange={e => setData('is_available', e.target.checked)}
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
