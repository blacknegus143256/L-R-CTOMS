import Modal from '@/components/Modal';

export default function AddNewAttributeModal({ 
    isOpen, 
    onClose, 
    targetCategoryId, 
    categories, 
    data, 
    setData, 
    onSubmit, 
    processing 
}) {
    const category = categories?.find(c => c.id === targetCategoryId);
    const categoryName = category?.name || '';

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-6">
                <h2 className="text-lg font-bold">Add New {categoryName} to Inventory</h2>
                
                <div className="mt-4">
                    <label className="block text-sm font-medium">Item Name</label>
                    <input 
                        type="text" 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        placeholder="e.g., Gold Silk Thread"
                        required
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Price (₱)</label>
                    <input 
                        type="number" 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={data.price}
                        onChange={e => setData('price', e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium">Unit</label>
                    <select 
                        className="w-full mt-1 border-gray-300 rounded-md"
                        value={data.unit}
                        onChange={e => setData('unit', e.target.value)}
                        required
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
                        checked={data.is_available !== false}
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
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Add to Inventory
                    </button>
                </div>
            </form>
        </Modal>
    );
}
