import Modal from '@/components/Modal';

export default function AddAttributeToShopModal({ 
    isOpen, 
    onClose, 
    attribute, 
    data, 
    setData, 
    onSubmit, 
    processing 
}) {
    if (!attribute) return null;

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Add {attribute.name} to Shop
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
                    </select>
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className="mr-3 text-gray-600">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow"
                    >
                        Save to Inventory
                    </button>
                </div>
            </form>
        </Modal>
    );
}
