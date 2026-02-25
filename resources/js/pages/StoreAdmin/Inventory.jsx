import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AddNewAttributeModal from '@/components/StoreAdmin/AddNewAttributeModal';
import AddCategoryModal from '@/components/StoreAdmin/AddCategoryModal';
import EditShopAttributeModal from '@/components/StoreAdmin/EditShopAttributeModal';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

const SERVICE_CATEGORIES = [
    'Custom Sewing',
    'Alterations',
    'Repairs',
    'Embroidery',
    'Formal Wear'
];

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

    // Service form state - Updated with new fields
    const { data: serviceData, setData: setServiceData, post: postService, reset: resetService, processing: serviceProcessing, errors: serviceErrors } = useForm({
        service_category: '',
        service_description: '',
        starting_price: '',
        turnaround_time: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
    });

    const submitService = (e) => {
        e.preventDefault();
        postService(route('store.services.add'), { onSuccess: () => resetService() });
    };

    // Edit service state
    const [editingService, setEditingService] = useState(null);
    const { data: editServiceData, setData: setEditServiceData, put: putService, reset: resetEditService, processing: editProcessing, errors: editServiceErrors } = useForm({
        service_category: '',
        service_description: '',
        starting_price: '',
        turnaround_time: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
    });

    const openEditModal = (service) => {
        setEditingService(service);
        setEditServiceData({
            service_category: service.service_category || '',
            service_description: service.service_description || '',
            starting_price: service.starting_price || '',
            turnaround_time: service.turnaround_time || '',
            is_available: service.is_available ?? true,
            rush_service_available: service.rush_service_available ?? false,
            appointment_required: service.appointment_required ?? false,
            notes: service.notes || '',
        });
    };

    const closeEditModal = () => {
        setEditingService(null);
        resetEditService();
    };

    const submitEditService = (e) => {
        e.preventDefault();
        putService(route('store.services.update', editingService.id), {
            onSuccess: () => closeEditModal()
        });
    };

    const deleteService = (id) => {
        if (confirm('Are you sure you want to delete this service?')) {
            router.delete(route('store.services.delete', id));
        }
    };

    // Category modal state
    const [categoryModal, setCategoryModal] = useState(false);
    const { data: categoryFormData, setData: setCategoryFormData, post: postCategory, processing: categoryProcessing, reset: resetCategoryForm } = useForm({
        name: '',
    });

    const submitCategory = (e) => {
        e.preventDefault();
        postCategory(route('store.categories.add'), { onSuccess: () => {
            setCategoryModal(false);
            resetCategoryForm();
        }});
    };

    // Edit attribute modal state
    const [editingAttribute, setEditingAttribute] = useState(null);
    const {data: editAttrData, setData: setEditAttrData, put: putAttribute, processing: attrProcessing, reset: resetEditAttr} = useForm({
        price: '',
        unit: '',
        notes: '',
        is_available: true,
    });

    const openEditAttrModal = (attr) => {
        setEditingAttribute(attr);
        setEditAttrData({
            price: attr.pivot.price,
            unit: attr.pivot.unit,
            notes: attr.pivot.notes || '',
            is_available: attr.pivot.is_available,
        });
    };
    const closeEditAttrModal = () => {
        setEditingAttribute(null);
        resetEditAttr();
    };
    const submitEditAttr = (e) => {
        e.preventDefault();
        putAttribute(route('store.attributes.update', editingAttribute.id), {
            onSuccess: () => closeEditAttrModal(),
        });
    };

    const deleteAttribute = (id) => {
        if (confirm('Are you sure you want to remove this attribute from your inventory?')) {
            router.delete(route('store.attributes.delete', id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Inventory Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Services Section */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Services</h2>
                        </div>

                        {/* Add Service Form */}
                        <form onSubmit={submitService} className="mb-6 p-4 bg-gray-50 rounded-lg border">
                            <h3 className="text-lg font-medium mb-4">Add New Service</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Basic Fields */}
                                <div className="md:col-span-2">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Fields</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Service Category</label>
                                    <select
                                        value={serviceData.service_category}
                                        onChange={e => setServiceData('service_category', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {SERVICE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Starting Price</label>
                                    <input 
                                        type="number"
                                        value={serviceData.starting_price}
                                        onChange={e => setServiceData('starting_price', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Turnaround Time (days)</label>
                                    <input 
                                        type="number"
                                        value={serviceData.turnaround_time}
                                        onChange={e => setServiceData('turnaround_time', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        min="0"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Service Description (optional)</label>
                                    <textarea
                                        value={serviceData.service_description}
                                        onChange={e => setServiceData('service_description', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        rows="2"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.is_available}
                                            onChange={e => setServiceData('is_available', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm">Available</span>
                                    </label>
                                </div>

                                {/* Optional Fields */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Fields</h4>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.rush_service_available}
                                            onChange={e => setServiceData('rush_service_available', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm">Rush Service Available</span>
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.appointment_required}
                                            onChange={e => setServiceData('appointment_required', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm">Appointment Required</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                    <textarea
                                        value={serviceData.notes}
                                        onChange={e => setServiceData('notes', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        rows="2"
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={serviceProcessing}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Service
                            </button>
                        </form>

                        {/* Services List */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turnaround</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {services.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                No services yet. Add your first service above.
                                            </td>
                                        </tr>
                                    ) : (
                                        services.map((service) => (
                                            <tr key={service.id}>
                                                <td className="px-4 py-3">{service.service_category}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                    {service.service_description || '-'}
                                                </td>
                                                <td className="px-4 py-3">${service.starting_price}</td>
                                                <td className="px-4 py-3">{service.turnaround_time} days</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${service.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {service.is_available ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {service.rush_service_available && <span className="mr-1">⚡ Rush</span>}
                                                    {service.appointment_required && <span>📅 Appt</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        onClick={() => openEditModal(service)}
                                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteService(service.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Attributes/Inventory Section */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Fabric Inventory</h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCategoryModal(true)}
                                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                >
                                    Add Category
                                </button>
                            </div>
                        </div>

                        {categories.map((cat) => (
                            <div key={cat.id} className="mb-6">
                                <div className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-t-lg">
                                    <h3 className="font-medium">{cat.name}</h3>
                                    <button 
                                        onClick={() => openNewAttributeModal(cat.id)}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Attribute
                                    </button>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Unit</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {shopAttributes
                                            .filter(sa => sa.attribute_category_id === cat.id)
                                            .map((shopAttr) => (
                                                <tr key={shopAttr.id}>
                                                    <td className="px-4 py-3">{shopAttr.name}</td>
                                                    <td className="px-4 py-3">${shopAttr.pivot.price}</td>
                                                    <td className="px-4 py-3">{shopAttr.pivot.unit}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${shopAttr.pivot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {shopAttr.pivot.is_available ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button 
                                                            onClick={() => openEditAttrModal(shopAttr)}
                                                            className="text-blue-600 hover:text-blue-800 mr-2"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteAttribute(shopAttr.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Attribute Modal */}
            <AddNewAttributeModal 
                isOpen={newAttributeModal}
                onClose={closeNewAttributeModal}
                categories={categories}
                targetCategoryId={targetCategoryId}
                data={attrData}
                setData={setAttrData}
                onSubmit={submitNewAttribute}
                processing={processingAttribute}
            />

            {/* Add Category Modal */}
            <AddCategoryModal 
                isOpen={categoryModal}
                onClose={() => setCategoryModal(false)}
                data={categoryFormData}
                setData={setCategoryFormData}
                onSubmit={submitCategory}
                processing={categoryProcessing}
            />

            {/* Edit Service Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit Service</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitEditService}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Service Category</label>
                                <select
                                    value={editServiceData.service_category}
                                    onChange={e => setEditServiceData('service_category', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {SERVICE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Starting Price</label>
                                <input 
                                    type="number"
                                    value={editServiceData.starting_price}
                                    onChange={e => setEditServiceData('starting_price', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Turnaround Time (days)</label>
                                <input 
                                    type="number"
                                    value={editServiceData.turnaround_time}
                                    onChange={e => setEditServiceData('turnaround_time', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    min="0"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Service Description</label>
                                <textarea
                                    value={editServiceData.service_description}
                                    onChange={e => setEditServiceData('service_description', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    rows="2"
                                />
                            </div>
                            <div className="mb-4 flex items-center gap-6">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editServiceData.is_available}
                                        onChange={e => setEditServiceData('is_available', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm">Available</span>
                                </label>
                            </div>
                            <div className="mb-4 flex items-center gap-6">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editServiceData.rush_service_available}
                                        onChange={e => setEditServiceData('rush_service_available', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm">Rush Service Available</span>
                                </label>
                            </div>
                            <div className="mb-4 flex items-center gap-6">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={editServiceData.appointment_required}
                                        onChange={e => setEditServiceData('appointment_required', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm">Appointment Required</span>
                                </label>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={editServiceData.notes}
                                    onChange={e => setEditServiceData('notes', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    rows="2"
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

            {/* Edit Attribute Modal */}
            <EditShopAttributeModal 
                show={!!editingAttribute}
                onClose={closeEditAttrModal}
                attribute={editingAttribute}
                editAttrData={editAttrData}
                setEditAttrData={setEditAttrData}
                submitEditAttr={submitEditAttr}
                attrProcessing={attrProcessing}
            />
        </AuthenticatedLayout>
    );
}
