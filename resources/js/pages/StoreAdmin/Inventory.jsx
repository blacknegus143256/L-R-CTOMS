import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AddNewAttributeModal from '@/components/StoreAdmin/AddNewAttributeModal';
import AddCategoryModal from '@/components/StoreAdmin/AddCategoryModal';
import EditShopAttributeModal from '@/components/StoreAdmin/EditShopAttributeModal';
import { Pencil, Trash2, Plus, X } from 'lucide-react';


export default function Inventory({ auth, services, categories, shopAttributes }) {
    
    const [newAttributeModal, setNewAttributeModal] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState(null);

    // Form state for creating new attribute with inventory details
    const {data: attrData, setData: setAttrData, post: postAttribute, processing: processingAttribute, reset: resetAttribute, errors: attributeErrors} = useForm({
        name: '',
        attribute_category_id: '',
        price: '',
        unit: 'per yard',
        notes: '',
        is_available: true,
    });

    const openNewAttributeModal = (catId) => {
        setTargetCategoryId(catId);
        setAttrData('attribute_category_id', catId);
        setNewAttributeModal(true);
    };
    const closeNewAttributeModal = () => {
        setTargetCategoryId(null);
        resetAttribute();
        setNewAttributeModal(false);
    };

    const submitNewAttribute = (e) => {
        e.preventDefault();
        postAttribute(route('store.master-attributes.add'), { onSuccess: () => {
            closeNewAttributeModal();
        }
        });
    };

    // Service form state
    const { data: serviceData, setData: setServiceData, post: postService, reset: resetService, processing: serviceProcessing } = useForm({
        service_name: '',
        price: '',
        duration_days: '',
    });

    const submitService = (e) => {
        e.preventDefault();
        postService(route('store.services.add'), { onSuccess: () => resetService() });
    };

    // Edit service state
    const [editingService, setEditingService] = useState(null);
    const { data: editServiceData, setData: setEditServiceData, put: putService, reset: resetEditService, processing: editProcessing } = useForm({
        service_name: '',
        price: '',
        duration_days: '',
    });

    const openEditModal = (service) => {
        setEditingService(service);
        setEditServiceData({
            service_name: service.service_name,
            price: service.price,
            duration_days: service.duration_days || '',
        });
    };

    const closeEditModal = () => {
        setEditingService(null);
        resetEditService();
    };

    const submitEditService = (e) => {
        e.preventDefault();
        putService(route('store.services.update', editingService.id), { onSuccess: () => closeEditModal() });
    };

    const deleteService = (serviceId) => {
        if (confirm('Are you sure you want to delete this service?')) {
            router.delete(route('store.services.delete', serviceId));
        }
    };

    // New category modal state
    const [newCategoryModal, setNewCategoryModal] = useState(false);
    const { data: categoryData, setData: setCategoryData, post: postCategory, processing: categoryProcessing, reset: resetCategory } = useForm({
        name: '',
    });

    const openNewCategoryModal = () => {
        setNewCategoryModal(true);
    };

    const closeNewCategoryModal = () => {
        setNewCategoryModal(false);
        resetCategory();
    };

    const submitNewCategory = (e) => {
        e.preventDefault();
        postCategory(route('store.categories.add'), { onSuccess: () => closeNewCategoryModal() });
    };

    // Edit shop attribute state
    const [editingShopAttr, setEditingShopAttr] = useState(null);
    const { data: editShopAttrData, setData: setEditShopAttrData, put: putShopAttr, reset: resetEditShopAttr, processing: editShopAttrProcessing } = useForm({
        price: '',
        unit: '',
        notes: '',
        is_available: true,
    });

    const openEditShopAttrModal = (item) => {
        
        const pivot = item.pivot || {};

        setEditingShopAttr(item);
        setEditShopAttrData({
            price: pivot.price || '',
            unit: pivot.unit || 'per yard',
            notes: pivot.notes || '',
            is_available: pivot.is_available ?? true,
        });
    };

    const closeEditShopAttrModal = () => {
        setEditingShopAttr(null);
        resetEditShopAttr();
    };

    const submitEditShopAttr = (e) => {
        e.preventDefault();
        putShopAttr(route('store.attributes.update', editingShopAttr.id), { onSuccess: () => closeEditShopAttrModal() });
    };

    const deleteShopAttr = (itemId) => {
        if (confirm('Are you sure you want to remove this item from your shop inventory?')) {
            router.delete(route('store.attributes.delete', itemId));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2>Shop Inventory & Services</h2>}>
            <Head title="Inventory" />
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                
                {/* Add Service Form */}
                <div className="bg-white p-6 shadow rounded-lg">
                    <h3 className="font-bold mb-4">Add New Service (e.g., Barong Making)</h3>
                    <form onSubmit={submitService} className="flex gap-4">
                        <input 
                            type="text" 
                            value={serviceData.service_name || ''} 
                            onChange={e => setServiceData('service_name', e.target.value)}
                            placeholder="Service Name" 
                            className="border-gray-300 rounded-md shadow-sm flex-1"
                            required
                        />
                        <input 
                            type="number" 
                            value={serviceData.price || ''} 
                            onChange={e => setServiceData('price', e.target.value)}
                            placeholder="Price" 
                            className="border-gray-300 rounded-md shadow-sm w-32"
                            required
                        />
                        <input 
                            type="number" 
                            value={serviceData.duration_days || ''} 
                            onChange={e => setServiceData('duration_days', e.target.value)}
                            placeholder="Duration (days)" 
                            className="border-gray-300 rounded-md shadow-sm w-32"
                        />
                        <button disabled={serviceProcessing} className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50">Add</button>
                    </form>
                </div>

                {/* Services Table */}
                <div className="bg-white overflow-hidden shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration (days)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {services.map((service) => (
                                <tr key={service.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.service_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">₱{service.price}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{service.duration_days || '-'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openEditModal(service)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteService(service.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Materials & Accessories Section - Unified Table */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Materials & Accessories</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={openNewCategoryModal}
                                className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700"
                            >
                                <Plus className="w-4 h-4" /> Add Category
                            </button>
                        </div>
                    </div>

                    {/* Add new attribute button for each category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-4 shadow rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-lg">{cat.name}</h4>
                                    <button 
                                        onClick={() => openNewAttributeModal(cat.id)}
                                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
                                    >
                                        <Plus className="w-4 h-4" /> Add Item
                                    </button>
                                </div>
                                
                                {/* Inventory count */}
                                <p className="text-sm text-gray-500">
                                    {shopAttributes?.filter(item => item.attribute_category?.id === cat.id).length || 0} items in inventory
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Unified Inventory Table */}
                    <div className="bg-white overflow-hidden shadow sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shopAttributes && shopAttributes.length > 0 ? (
                                    shopAttributes.map((item) => {
                                        const pivot = item.pivot || {};
                                        return (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.attribute_category?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">₱{pivot.price || '0'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{pivot.unit || 'per item'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={pivot.notes}>
                                                {pivot.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {pivot.is_available ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Available
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                        Unavailable
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => openEditShopAttrModal(item)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteShopAttr(item.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No materials or accessories in inventory yet. Click "Add Item" above to add your first item.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            
            <AddNewAttributeModal 
                isOpen={newAttributeModal}
                onClose={closeNewAttributeModal}
                targetCategoryId={targetCategoryId}
                categories={categories}
                data={attrData}
                setData={setAttrData}
                onSubmit={submitNewAttribute}
                processing={processingAttribute}
            />

            {/* Add Category Modal */}
            <AddCategoryModal 
                isOpen={newCategoryModal}
                onClose={closeNewCategoryModal}
                data={categoryData}
                setData={setCategoryData}
                onSubmit={submitNewCategory}
                processing={categoryProcessing}
            />

            {/* Edit Shop Attribute Modal */}
            <EditShopAttributeModal
                isOpen={editingShopAttr !== null}
                onClose={closeEditShopAttrModal}
                item={editingShopAttr}
                data={editShopAttrData}
                setData={setEditShopAttrData}
                onSubmit={submitEditShopAttr}
                processing={editShopAttrProcessing}
            />

            {/* Edit Service Modal */}
            {editingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeEditModal}></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10">
                        <h3 className="text-lg font-bold mb-4">Edit Service</h3>
                        <form onSubmit={submitEditService}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Service Name</label>
                                <input 
                                    type="text"
                                    value={editServiceData.service_name}
                                    onChange={e => setEditServiceData('service_name', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Price</label>
                                <input 
                                    type="number"
                                    value={editServiceData.price}
                                    onChange={e => setEditServiceData('price', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                                <input 
                                    type="number"
                                    value={editServiceData.duration_days}
                                    onChange={e => setEditServiceData('duration_days', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={editProcessing}
                                    className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </AuthenticatedLayout>
    );
}
