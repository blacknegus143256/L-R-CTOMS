import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AddNewAttributeModal from '@/Components/StoreAdmin/AddNewAttributeModal';
import AddCategoryModal from '@/Components/StoreAdmin/AddCategoryModal';
import EditShopAttributeModal from '@/Components/StoreAdmin/EditShopAttributeModal';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function Inventory({ auth, services, categories, shopAttributes, serviceCategories = [], attributeTypes = [] }) {
    
    const [newAttributeModal, setNewAttributeModal] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState(null);

    // Form state for creating new attribute with inventory details
    const {data: attrData, setData: setAttrData, post: postAttribute, processing: processingAttribute, reset: resetAttribute, errors: attributeErrors} = useForm({
        attribute_category_id: '',
        attribute_type_id: '',
        item_name: '',
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

        console.log("Submitting data:", attrData);
        postAttribute(route('store.master-attributes.add'), { onSuccess: () => {
            closeNewAttributeModal();
        }});
    };

    // Helper function to get service category name from ID
    const getServiceCategoryName = (categoryId) => {
        if (!categoryId) return '-';
        const cat = serviceCategories.find(c => c.id === categoryId || c.id === parseInt(categoryId));
        return cat ? cat.name : categoryId;
    };

    // Service form state - Updated with new fields
    const { data: serviceData, setData: setServiceData, post: postService, reset: resetService, processing: serviceProcessing, errors: serviceErrors } = useForm({
        service_category_id: '',
        service_name: '',
        service_description: '',
        price: '',
        duration_days: '',
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
        service_category_id: '',
        service_name: '',
        service_description: '',
        price: '',
        duration_days: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
    });

    const openEditModal = (service) => {
        setEditingService(service);
        setEditServiceData({
            service_category_id: service.service_category_id || '',
            service_name: service.service_name || '',
            service_description: service.service_description || '',
            price: service.price || '',
            duration_days: service.duration_days || '',
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
        attribute_type_id: '',
        item_name: '',
        price: '',
        unit: '',
        notes: '',
        is_available: true,
    });

    const openEditAttrModal = (attr) => {
        setEditingAttribute(attr);
        setEditAttrData({
            attribute_type_id: attr.pivot.id,
            item_name: attr.pivot.item_name || '',
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
        console.log('Submitting edit for attribute ID:', editingAttribute.id, 'with data:', editAttrData);
        putAttribute(route('store.attributes.update', editingAttribute.id), {
            onSuccess: () => closeEditAttrModal(),
        });
    };

    const deleteAttribute = (id) => {
        if (confirm('Are you sure you want to remove this attribute from your inventory?')) {
            router.delete(route('store.attributes.delete', id));
        }
    };

    // PHASE 1: Smart Category Split Logic
    const activeCategories = categories.filter(cat => 
        shopAttributes.some(attr => attr.attribute_category_id === cat.id)
    );
    const inactiveCategories = categories.filter(cat => 
        !shopAttributes.some(attr => attr.attribute_category_id === cat.id)
    );

    const getCategoryAssets = (catId) => shopAttributes.filter(sa => sa.attribute_category_id === catId);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Inventory Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Services Section */}
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-emerald-100/50 p-10 shadow-2xl shadow-emerald-900/5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent tracking-tight mb-8">Services</h2>
                        </div>

                        {/* Add Service Form */}
                        <form onSubmit={submitService} className="mb-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Add New Service</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Service Category</label>
                                    <select
                                        value={serviceData.service_category_id}
                                        onChange={e => setServiceData('service_category_id', Number(e.target.value))}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {serviceCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Service Name</label>
                                    <input
                                        type="text"
                                        value={serviceData.service_name}
                                        onChange={e => setServiceData('service_name', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Price (₱)</label>
                                    <input 
                                        type="number"
                                        value={serviceData.price}
                                        onChange={e => setServiceData('price', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Days)</label>
                                    <input 
                                        type="number"
                                        value={serviceData.duration_days}
                                        onChange={e => setServiceData('duration_days', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4"
                                        min="0"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={serviceData.service_description}
                                        onChange={e => setServiceData('service_description', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 resize-vertical"
                                        rows="3"
                                    />
                                </div>

                                <div className="flex items-center md:col-span-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.is_available}
                                            onChange={e => setServiceData('is_available', e.target.checked)}
                                            className="w-5 h-5 rounded border-stone-200 focus:ring-orchid-blue/20 text-orchid-blue"
                                        />
                                        <span className="ml-3 text-lg font-semibold text-slate-700">Available for Orders</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Advanced Options</h4>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.rush_service_available}
                                            onChange={e => setServiceData('rush_service_available', e.target.checked)}
                                            className="w-5 h-5 rounded border-stone-200 focus:ring-orchid-blue/20 text-orchid-blue"
                                        />
                                        <span className="ml-3 text-lg font-semibold text-slate-700">Rush Service Available</span>
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={serviceData.appointment_required}
                                            onChange={e => setServiceData('appointment_required', e.target.checked)}
                                            className="w-5 h-5 rounded border-stone-200 focus:ring-orchid-blue/20 text-orchid-blue"
                                        />
                                        <span className="ml-3 text-lg font-semibold text-slate-700">Appointment Required</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Internal Notes</label>
                                    <textarea
                                        value={serviceData.notes}
                                        onChange={e => setServiceData('notes', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-sm py-3 px-4 resize-vertical"
                                        rows="3"
                                        placeholder="Special instructions for staff..."
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={serviceProcessing}
                                className="mt-8 w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black py-4 px-8 rounded-3xl text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 justify-center disabled:opacity-50"
                            >
                                <Plus size={24} />
                                Add Elite Service
                            </button>
                        </form>

                        {/* Services List */}
                        <div className="overflow-x-auto mt-12">
                            <table className="min-w-full divide-y divide-emerald-100 [&_tr]:hover:bg-emerald-50/50 [&_tr]:transition-all [&_tr]:duration-300 [&_tr]:group">
                                <thead className="bg-emerald-50/50 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Options</th>
                                        <th className="px-6 py-5 text-right text-xs font-black text-emerald-900 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-emerald-100">
                                    {services.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-20 text-center">
                                                <div className="text-6xl opacity-20 mb-4">⚡</div>
                                                <h3 className="text-2xl font-black text-slate-500 mb-2">No Services Yet</h3>
                                                <p className="text-lg text-slate-400">Add your first premium service above</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        services.map((service) => (
                                            <tr key={service.id} className="group hover:shadow-emerald-200/50">
                                                <td className="px-6 py-6 font-semibold text-slate-800">{getServiceCategoryName(service.service_category_id)}</td>
                                                <td className="px-6 py-6">
                                                    <span className="inline-flex items-center px-4 py-2 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-xl border border-white/10 ring-1 ring-white/5">
                                                        {service.service_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-slate-600 max-w-md">
                                                    {service.service_description || 'No description'}
                                                </td>
                                                <td className="px-6 py-6 font-mono font-bold text-2xl text-emerald-900">₱{service.price}</td>
                                                <td className="px-6 py-6 font-semibold text-slate-700">{service.duration_days || 0} days</td>
                                                <td className="px-6 py-6">
                                                    <span className={`inline-flex px-4 py-2 text-xs font-black rounded-full shadow-lg ${service.is_available ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 backdrop-blur-sm' : 'bg-slate-100/80 text-slate-900 border border-slate-300/50 backdrop-blur-sm'}`}>
                                                        {service.is_available ? 'LIVE' : 'PAUSED'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-semibold">
                                                    {service.rush_service_available && <span className="inline-flex px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full mr-2">⚡ RUSH</span>}
                                                    {service.appointment_required && <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">📅 APPT</span>}
                                                </td>
                                                <td className="px-6 py-6 text-right space-x-2">
                                                    <button 
                                                        onClick={() => openEditModal(service)}
                                                        className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-2xl transition-all group"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteService(service.id)}
                                                        className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-2xl transition-all group"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PHASE 3+4: Smart Inventory Section */}
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-emerald-100/50 p-10 shadow-2xl shadow-emerald-900/5">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent tracking-tight">Inventory Assets</h2>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setCategoryModal(true)}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl hover:shadow-slate-500/50 hover:scale-[1.02] transition-all duration-300 text-sm"
                                >
                                    <Plus size={18} />
                                    New Category
                                </button>
                            </div>
                        </div>

                        {/* PHASE 3: Active Assets View */}
                        {activeCategories.length === 0 ? (
                            <div className="text-center py-24 border-4 border-dashed border-emerald-200/50 rounded-3xl bg-emerald-50/50 backdrop-blur-xl">
                                <div className="text-8xl mb-8 opacity-20">📦</div>
                                <h3 className="text-4xl font-black text-slate-800 mb-4">No Active Assets</h3>
                                <p className="text-2xl text-slate-500 mb-8 max-w-2xl mx-auto">Activate a category below to start managing your inventory</p>
                            </div>
                        ) : (
                            activeCategories.map((cat) => {
                                const categoryAssets = getCategoryAssets(cat.id);
                                return (
                                    <div key={cat.id} className="mb-16">
                                        <div className="flex justify-between items-center bg-gradient-to-r from-slate-950/20 to-slate-900/20 backdrop-blur-xl px-8 py-6 rounded-3xl border border-slate-800/20 mb-6">
                                            <h3 className="text-2xl font-black text-slate-50 drop-shadow-lg">{cat.name}</h3>
                                            <button 
                                                onClick={() => openNewAttributeModal(cat.id)}
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black py-3 px-6 rounded-2xl shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300 text-sm"
                                            >
                                                <Plus size={18} />
                                                Add Asset
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-emerald-100 [&_tr]:hover:bg-emerald-50/50 [&_tr]:transition-all [&_tr]:duration-300 [&_tr]:group">
                                                <thead className="bg-emerald-50/50 backdrop-blur-sm">
                                                    <tr>
                                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Asset Name</th>
                                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Price</th>
                                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Unit</th>
                                                        <th className="px-6 py-5 text-left text-xs font-black text-emerald-900 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-5 text-right text-xs font-black text-emerald-900 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-emerald-100">
                                                    {categoryAssets.map((shopAttr) => (
                                                        <tr key={`${shopAttr.id}-${shopAttr.pivot?.item_name || ''}`} className="group hover:shadow-emerald-200/50">
                                                            <td className="px-6 py-6">
                                                                <span className="inline-flex items-center px-4 py-2 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-xl border border-white/10 ring-1 ring-white/5">
                                                                    {shopAttr.pivot.item_name || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-6 font-mono font-bold text-2xl text-emerald-900">₱{shopAttr.pivot.price}</td>
                                                            <td className="px-6 py-6 font-semibold text-slate-700">{shopAttr.pivot.unit}</td>
                                                            <td className="px-6 py-6">
                                                                <span className={`inline-flex px-4 py-2 text-xs font-black rounded-full shadow-lg ${shopAttr.pivot.is_available ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 backdrop-blur-sm' : 'bg-slate-100/80 text-slate-900 border border-slate-300/50 backdrop-blur-sm'}`}>
                                                                    {shopAttr.pivot.is_available ? 'STOCKED' : 'OUT'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-6 text-right space-x-2">
                                                                <button 
                                                                    onClick={() => openEditAttrModal(shopAttr)}
                                                                    className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-2xl transition-all group"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => deleteAttribute(shopAttr.id)}
                                                                    className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-2xl transition-all group"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* PHASE 4: Quick-Activate Grid */}
                        {inactiveCategories.length > 0 && (
                            <div className="mt-20 pt-12 border-t-4 border-emerald-200/30">
                                <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight mb-10 text-center">
                                    Available Categories
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {inactiveCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => openNewAttributeModal(cat.id)}
                                            className="group relative bg-white/80 backdrop-blur-xl hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/25 hover:border-emerald-400/80 hover:scale-[1.05] transition-all duration-500 rounded-3xl border-2 border-emerald-200/50 p-10 text-center shadow-xl hover:shadow-emerald-300/20"
                                        >
                                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:animate-tilt"></div>
                                            <div className="relative flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-emerald-300/50 group-hover:scale-110 transition-all">
                                                    <Plus className="w-10 h-10 text-emerald-700 font-bold" />
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 drop-shadow-lg leading-tight">{cat.name}</h4>
                                                <span className="text-sm text-emerald-600 font-bold uppercase tracking-wider px-4 py-2 bg-emerald-100/80 rounded-2xl border border-emerald-200/50 backdrop-blur-sm shadow-inner">Activate</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Service Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl shadow-slate-900/20 border border-emerald-200/50">
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-emerald-200/50">
                            <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent">Edit Service</h3>
                            <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={submitEditService}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold text-slate-800 mb-3">Service Name</label>
                                    <input
                                        type="text"
                                        value={editServiceData.service_name}
                                        onChange={e => setEditServiceData('service_name', e.target.value)}
                                        className="w-full border-stone-200 focus:border-orchid-blue focus:ring-4 focus:ring-orchid-blue/10 rounded-2xl transition-all duration-300 shadow-lg py-4 px-6 text-xl"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-4 pt-8 border-t border-emerald-200/30">
                                    <button 
                                        type="button"
                                        onClick={closeEditModal}
                                        className="px-8 py-4 text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={editProcessing}
                                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black px-10 py-4 rounded-3xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 text-lg flex items-center gap-3"
                                    >
                                        <Pencil size={20} />
                                        Save Elite Changes
                                    </button>
                                </div>
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
                attributeTypes={attributeTypes}
            />

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
                attributeTypes={attributeTypes}
            />

            {/* Add Category Modal */}
            <AddCategoryModal 
                isOpen={categoryModal}
                onClose={() => setCategoryModal(false)}
                data={categoryFormData}
                setData={setCategoryFormData}
                onSubmit={submitCategory}
                processing={categoryProcessing}
                categories={categories}
            />

        </AuthenticatedLayout>
    );
}

