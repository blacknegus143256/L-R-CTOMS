import Modal from '@/components/Modal';

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
        <form onSubmit={onSubmit} className="p-6">
            <h2 className="text-lg font-bold">
                Add New {categoryName} Item
            </h2>

            {/* ATTRIBUTE TYPE DROPDOWN */}
            <div className="mt-4">
                <label className="block text-sm font-medium">
                    {categoryName} Type
                </label>
                <select
                    className="w-full mt-1 border-gray-300 rounded-md"
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
            <div className="mt-4">
                <label className="block text-sm font-medium">
                    Item Name / Details
                </label>
                <input
                    type="text"
                    className="w-full mt-1 border-gray-300 rounded-md"
                    value={data.item_name || ''}
                    onChange={e => setData('item_name', e.target.value)}
                    placeholder="e.g., Blue Floral Cotton"
                    required
                />
            </div>

            {/* PRICE */}
            <div className="mt-4">
                <label className="block text-sm font-medium">Price (₱)</label>
                <input
                    type="number"
                    className="w-full mt-1 border-gray-300 rounded-md"
                    value={data.price || ''}
                    onChange={e => setData('price', e.target.value)}
                    placeholder="0.00"
                />
            </div>

            {/* UNIT */}
            <div className="mt-4">
                <label className="block text-sm font-medium">Unit</label>
                <select
                    className="w-full mt-1 border-gray-300 rounded-md"
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
            <div className="mt-4">
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                    className="w-full mt-1 border-gray-300 rounded-md"
                    value={data.notes || ''}
                    onChange={e => setData('notes', e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                />
            </div>

            {/* AVAILABILITY */}
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

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="mr-3 text-gray-600">
                    Cancel
                </button>
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