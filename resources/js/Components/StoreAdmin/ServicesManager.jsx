import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Image, Pencil, Trash2, Plus, X, Clock, DollarSign, CheckCircle, AlertCircle, Calendar, FileText } from 'lucide-react';
import { TbCurrencyPeso } from 'react-icons/tb';
import { confirmDialog } from '@/utils/dialog';
import { getImageUploadError } from '@/utils/imageUpload';
import { getImageUploadError } from '@/utils/imageUpload';
export default function ServicesManager({ services, serviceCategories, getServiceCategoryName, onSaved }) {
    const [addImagePreview, setAddImagePreview] = useState(null);
    const [addImageError, setAddImageError] = useState('');
    const { data: serviceData, setData: setServiceData, post: postService, reset: resetService, processing: serviceProcessing } = useForm({
        service_category_id: '',
        service_name: '',
        service_description: '',
        price: '',
        duration_days: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
        checkout_type: 'requires_quote',
        image: null,
    });

    const submitService = (e) => {
        e.preventDefault();
        if (addImageError) {
            return;
        }
        postService(route('store.services.add'), { 
            forceFormData: true,
            onSuccess: () => {
                resetService();
                setAddImagePreview(null);
                setAddImageError('');
                onSaved?.();
            } 
        });
    };

    const [editingService, setEditingService] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState(null);
    const [editImageError, setEditImageError] = useState('');
    const { data: editServiceData, setData: setEditServiceData, put: putService, reset: resetEditService, processing: editProcessing } = useForm({
        service_category_id: '',
        service_name: '',
        service_description: '',
        price: '',
        duration_days: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
        checkout_type: 'requires_quote',
        image: null,
    });

    const openEditModal = (service) => {
        setEditImagePreview(service.image ? `/storage/${service.image}` : null);
        setEditImageError('');
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
        checkout_type: service.checkout_type || 'requires_quote',
        image: null,
        });
        setEditingService(service);
    };

    const closeEditModal = () => {
        setEditingService(null);
        setEditImagePreview(null);
        setEditImageError('');
        resetEditService();
    };

    const submitEditService = (e) => {
        e.preventDefault();
        if (editImageError) {
            return;
        }
        
        // For file uploads on update, Laravel requires POST with _method spoofing
        router.post(route('store.services.update', editingService.id), {
            _method: 'put',
            service_category_id: editServiceData.service_category_id,
            service_name: editServiceData.service_name,
            service_description: editServiceData.service_description,
            price: editServiceData.price,
            duration_days: editServiceData.duration_days,
            is_available: editServiceData.is_available,
            rush_service_available: editServiceData.rush_service_available,
            appointment_required: editServiceData.appointment_required,
            notes: editServiceData.notes,
            checkout_type: editServiceData.checkout_type,
            image: editServiceData.image
        }, {
            forceFormData: true,
            onSuccess: () => {
                closeEditModal();
                onSaved?.();
            }
        });
    };

    const handleServiceImageChange = (file) => {
        if (!file) {
            setAddImageError('');
            setServiceData('image', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setAddImageError(error);
            setServiceData('image', null);
            return;
        }

        setAddImageError('');
        setServiceData('image', file);
        setAddImagePreview(URL.createObjectURL(file));
    };

    const handleEditServiceImageChange = (file) => {
        if (!file) {
            setEditImageError('');
            setEditServiceData('image', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setEditImageError(error);
            setEditServiceData('image', null);
            return;
        }

        setEditImageError('');
        setEditServiceData('image', file);
        setEditImagePreview(URL.createObjectURL(file));
    };

    const deleteService = async (id) => {
        const confirmed = await confirmDialog({
            title: 'Delete Service',
            message: 'Are you sure you want to delete this service? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'error',
        });

        if (confirmed) {
            router.delete(route('store.services.delete', id));
        }
    };

    return (
        <>
            {/* Services Card */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-emerald-100/50 p-10 shadow-2xl shadow-emerald-900/5">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                            Services Management
                        </h2>
                        <p className="text-slate-600 mt-2">Manage your tailoring services, pricing, and availability</p>
                    </div>
                </div>

                {/* Add New Service Form */}
                <form onSubmit={submitService} className="mb-12 p-8 bg-gradient-to-br from-emerald-50/80 to-green-50/80 backdrop-blur-sm rounded-3xl border border-emerald-200/50 shadow-xl">
                    <h3 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <Plus className="w-8 h-8 text-emerald-600" />
                        Add New Service
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Information */}
                        <div className="lg:col-span-2">
                            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-emerald-600" />
                                Basic Information
                            </h4>
                        </div>
                        
                        {/* Service Category */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Service Category *</label>
                            <select
                                value={serviceData.service_category_id}
                                onChange={e => setServiceData('service_category_id', Number(e.target.value))}
                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50"
                                required
                            >
                                <option value="">Select Service Category</option>
                                {serviceCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Service Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Service Name *</label>
                            <input
                                type="text"
                                value={serviceData.service_name}
                                onChange={e => setServiceData('service_name', e.target.value)}
                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50"
                                placeholder="e.g. Suit Tailoring, Pant Hemming"
                                required
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                <TbCurrencyPeso className="w-4 h-4 text-emerald-600" />
                                Price (₱) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={serviceData.price}
                                onChange={e => setServiceData('price', parseFloat(e.target.value) || '')}
                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                Estimated Duration (days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={serviceData.duration_days}
                                onChange={e => setServiceData('duration_days', parseInt(e.target.value) || '')}
                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="e.g. 3"
                            />
                        </div>

                        {/* Checkout Type */}
                        <div className="lg:col-span-2 mt-2 mb-2">
                            <label className="block text-sm font-bold text-slate-700 mb-3">Checkout Mode *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div onClick={() => setServiceData('checkout_type', 'requires_quote')} className={`cursor-pointer p-5 border-2 rounded-2xl transition-all ${serviceData.checkout_type === 'requires_quote' ? 'border-emerald-500 bg-emerald-50/80 shadow-md' : 'border-stone-200 bg-white/50 hover:border-emerald-300'}`}>
                                    <div className="flex items-center gap-3 mb-2 pointer-events-none">
                                        <input type="radio" readOnly checked={serviceData.checkout_type === 'requires_quote'} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                                        <span className="font-black text-slate-800 text-lg">Request Quote (Custom)</span>
                                    </div>
                                    <p className="text-sm text-slate-600 ml-8 font-medium pointer-events-none">Customer submits design/measurements, tailor sets final price.</p>
                                </div>
                                <div onClick={() => setServiceData('checkout_type', 'fixed_price')} className={`cursor-pointer p-5 border-2 rounded-2xl transition-all ${serviceData.checkout_type === 'fixed_price' ? 'border-emerald-500 bg-emerald-50/80 shadow-md' : 'border-stone-200 bg-white/50 hover:border-emerald-300'}`}>
                                    <div className="flex items-center gap-3 mb-2 pointer-events-none">
                                        <input type="radio" readOnly checked={serviceData.checkout_type === 'fixed_price'} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                                        <span className="font-black text-slate-800 text-lg">Fixed Price (Instant Buy)</span>
                                    </div>
                                    <p className="text-sm text-slate-600 ml-8 font-medium pointer-events-none">Customer buys instantly at set price + selected materials.</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-3">Description</label>
                            <textarea
                                rows="3"
                                value={serviceData.service_description}
                                onChange={e => setServiceData('service_description', e.target.value)}
                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 resize-vertical"
                                placeholder="Brief description of the service..."
                            />
                        </div>

                        {/* Availability Options */}
                        <div className="lg:col-span-2">
                            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                                Availability &amp; Options
                            </h4>
                        </div>

                        {/* Is Available */}
                        <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                            <input
                                type="checkbox"
                                id="is_available"
                                checked={serviceData.is_available}
                                onChange={e => setServiceData('is_available', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                            />
                            <label htmlFor="is_available" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                Service is currently available
                            </label>
                        </div>

                        {/* Rush Service */}
                        <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                            <input
                                type="checkbox"
                                id="rush_service_available"
                                checked={serviceData.rush_service_available}
                                onChange={e => setServiceData('rush_service_available', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                            />
                            <label htmlFor="rush_service_available" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                Rush service available
                            </label>
                        </div>

                        {/* Appointment Required */}
                        <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                            <input
                                type="checkbox"
                                id="appointment_required"
                                checked={serviceData.appointment_required}
                                onChange={e => setServiceData('appointment_required', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                            />
                            <label htmlFor="appointment_required" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                Appointment required before service
                            </label>
                        </div>

                        {/* Notes */}
                        <div className="lg:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                Internal Notes
                            </label>
                            <textarea
                                rows="2"
                                value={serviceData.notes}
                                onChange={e => setServiceData('notes', e.target.value)}
                                className="w-full border border-stone-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 resize-vertical"
                                placeholder="Internal notes for staff (not visible to customers)..."
                            />
                        </div>

                        {/* Portfolio Image */}
                        <div className="lg:col-span-2">
                            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Image className="w-6 h-6 text-emerald-600" />
                                Portfolio Image
                            </h4>
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleServiceImageChange(e.target.files[0] || null)}
                                    className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-lg file:font-semibold file:bg-gradient-to-r file:from-emerald-600 file:to-emerald-700 file:text-white hover:file:from-emerald-700 hover:file:to-emerald-800"
                                />
                                {addImageError && <p className="text-sm font-semibold text-rose-600">{addImageError}</p>}
                                {addImagePreview && (
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={addImagePreview} 
                                            alt="Preview" 
                                            className="w-24 h-24 object-cover rounded-2xl shadow-lg border-4 border-emerald-200/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setServiceData('image', null);
                                                setAddImagePreview(null);
                                                setAddImageError('');
                                            }}
                                            className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 font-semibold transition-all"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-8 border-t border-emerald-200">
                        <button 
                            type="submit"
                            disabled={serviceProcessing}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-400 disabled:to-emerald-500 text-white font-black py-5 px-10 rounded-3xl text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <Plus size={28} />
                            {serviceProcessing ? 'Adding...' : 'Add New Service'}
                        </button>
                        <button
                            type="button"
                            onClick={() => resetService()}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold py-5 px-10 rounded-3xl text-xl shadow-xl hover:shadow-slate-400/50 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <X size={24} />
                            Reset Form
                        </button>
                    </div>
                </form>

                {/* Services Table */}
                {services.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="w-24 h-24 text-slate-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No Services Yet</h3>
                        <p className="text-slate-600 max-w-md mx-auto">Add your first service using the form above to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-emerald-100/50 shadow-2xl backdrop-blur-sm bg-white/60">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-emerald-100">
                                <thead className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
                                    <tr>
                                        <th className="px-6 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Image</th>
                                        <th className="px-8 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Service</th>
                                        <th className="px-6 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Price</th>
                                        <th className="px-6 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Duration</th>
                                        <th className="px-6 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Status</th>
                                        <th className="px-6 py-6 text-left text-xl font-black text-slate-800 tracking-tight">Options</th>
                                        <th className="px-6 py-6 text-right text-xl font-black text-slate-800 tracking-tight">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100 [&>*:hover]:bg-emerald-50/50 transition-all duration-200">
                                    {services.map((service) => (
                                        <tr key={service.id} className="group">
                                            <td className="px-6 py-6">
                                                {service.image ? (
                                                    <img 
                                                        src={`/storage/${service.image}`} 
                                                        alt={service.service_name} 
                                                        className="w-16 h-16 object-cover rounded-xl shadow-md hover:scale-110 transition-transform cursor-pointer"
                                                        onError={(e) => {
                                                            e.target.src = '/images/no-image.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-slate-500" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <div className="text-xl font-bold text-slate-900 group-hover:text-emerald-700">{service.service_name}</div>
                                                    <div className="text-slate-600 flex items-center gap-2 mt-1 text-sm">
                                                        <span className="font-semibold text-emerald-700">{getServiceCategoryName(service.service_category_id)}</span>
                                                    </div>
                                                    {service.service_description && (
                                                        <div className="text-slate-600 mt-2 text-sm max-w-md line-clamp-2">{service.service_description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-2xl font-black text-emerald-700">₱{parseFloat(service.price).toLocaleString()}</div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 px-2 py-1 inline-block rounded-md ${service.checkout_type === 'fixed_price' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {service.checkout_type === 'fixed_price' ? 'Instant Buy' : 'Requires Quote'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {service.duration_days > 0 ? (
                                                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                                        <Clock className="w-5 h-5 text-amber-600" />
                                                        {service.duration_days} {service.duration_days === 1 ? 'day' : 'days'}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 text-sm font-medium">Same day</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${service.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {service.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {service.rush_service_available && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 font-semibold">
                                                            Rush <AlertCircle className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                    {service.appointment_required && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">
                                                            Appt Required <Calendar className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                    {!service.notes ? null : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-800 font-semibold">
                                                            Notes
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(service)}
                                                        disabled={editProcessing}
                                                        className="p-3 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-2xl transition-all duration-200 group disabled:opacity-50"
                                                        title="Edit Service"
                                                    >
                                                        <Pencil size={20} className="group-hover:scale-110" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteService(service.id)}
                                                        className="p-3 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-2xl transition-all duration-200 group"
                                                        title="Delete Service"
                                                    >
                                                        <Trash2 size={20} className="group-hover:scale-110" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edit Service Modal */}
                {editingService && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
                        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-emerald-200/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white/100 backdrop-blur-sm border-b border-emerald-200/50 p-8 rounded-t-3xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                            <Pencil className="w-9 h-9 text-emerald-600" />
                                            Edit Service
                                        </h3>
                                        <p className="text-slate-600 mt-2">{editingService.service_name}</p>
                                    </div>
                                    <button
                                        onClick={closeEditModal}
                                        disabled={editProcessing}
                                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        <X className="w-6 h-6 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={submitEditService} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Same fields as add form but pre-filled */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Service Category *</label>
                                        <select
                                            value={editServiceData.service_category_id}
                                            onChange={e => setEditServiceData('service_category_id', Number(e.target.value))}
                                            className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50"
                                            required
                                            disabled={editProcessing}
                                        >
                                            <option value="">Select Service Category</option>
                                            {serviceCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Service Name *</label>
                                        <input
                                            type="text"
                                            value={editServiceData.service_name}
                                            onChange={e => setEditServiceData('service_name', e.target.value)}
                                            className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50"
                                            required
                                            disabled={editProcessing}
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                            <TbCurrencyPeso className="w-4 h-4 text-emerald-600" />
                                            Price (₱) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editServiceData.price}
                                            onChange={e => setEditServiceData('price', parseFloat(e.target.value) || '')}
                                            className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            required
                                            disabled={editProcessing}
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                            <Clock className="w-4 h-4 text-emerald-600" />
                                            Duration (days)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editServiceData.duration_days}
                                            onChange={e => setEditServiceData('duration_days', parseInt(e.target.value) || '')}
                                            className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            disabled={editProcessing}
                                        />
                                    </div>

                                    {/* Checkout Type (Edit Modal) */}
                                    <div className="lg:col-span-2 mt-2 mb-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Checkout Mode *</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div onClick={() => !editProcessing && setEditServiceData('checkout_type', 'requires_quote')} className={`cursor-pointer p-5 border-2 rounded-2xl transition-all ${editServiceData.checkout_type === 'requires_quote' ? 'border-emerald-500 bg-emerald-50/80 shadow-md' : 'border-stone-200 bg-white/50 hover:border-emerald-300'} ${editProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <div className="flex items-center gap-3 mb-2 pointer-events-none">
                                                    <input type="radio" readOnly checked={editServiceData.checkout_type === 'requires_quote'} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                                                    <span className="font-black text-slate-800 text-lg">Request Quote (Custom)</span>
                                                </div>
                                                <p className="text-sm text-slate-600 ml-8 font-medium pointer-events-none">Customer submits design/measurements, tailor sets final price.</p>
                                            </div>
                                            <div onClick={() => !editProcessing && setEditServiceData('checkout_type', 'fixed_price')} className={`cursor-pointer p-5 border-2 rounded-2xl transition-all ${editServiceData.checkout_type === 'fixed_price' ? 'border-emerald-500 bg-emerald-50/80 shadow-md' : 'border-stone-200 bg-white/50 hover:border-emerald-300'} ${editProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <div className="flex items-center gap-3 mb-2 pointer-events-none">
                                                    <input type="radio" readOnly checked={editServiceData.checkout_type === 'fixed_price'} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                                                    <span className="font-black text-slate-800 text-lg">Fixed Price (Instant Buy)</span>
                                                </div>
                                                <p className="text-sm text-slate-600 ml-8 font-medium pointer-events-none">Customer buys instantly at set price + selected materials.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Description</label>
                                        <textarea
                                            rows="3"
                                            value={editServiceData.service_description}
                                            onChange={e => setEditServiceData('service_description', e.target.value)}
                                            className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 resize-vertical"
                                            disabled={editProcessing}
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            Availability &amp; Options
                                        </h4>
                                    </div>

                                    <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            id="edit_is_available"
                                            checked={editServiceData.is_available}
                                            onChange={e => setEditServiceData('is_available', e.target.checked)}
                                            className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                                            disabled={editProcessing}
                                        />
                                        <label htmlFor="edit_is_available" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                            Service is currently available
                                        </label>
                                    </div>

                                    <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            id="edit_rush_service_available"
                                            checked={editServiceData.rush_service_available}
                                            onChange={e => setEditServiceData('rush_service_available', e.target.checked)}
                                            className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                                            disabled={editProcessing}
                                        />
                                        <label htmlFor="edit_rush_service_available" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                            Rush service available (Additional charge applies)
                                        </label>
                                    </div>

                                    <div className="flex items-center p-4 border border-stone-200 rounded-2xl bg-white/50 hover:border-emerald-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            id="edit_appointment_required"
                                            checked={editServiceData.appointment_required}
                                            onChange={e => setEditServiceData('appointment_required', e.target.checked)}
                                            className="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 focus:ring-2 mr-4"
                                            disabled={editProcessing}
                                        />
                                        <label htmlFor="edit_appointment_required" className="text-lg font-semibold text-slate-800 cursor-pointer select-none flex-1">
                                            Appointment required before service
                                        </label>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            Internal Notes
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={editServiceData.notes}
                                            onChange={e => setEditServiceData('notes', e.target.value)}
                                            className="w-full border border-stone-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 resize-vertical"
                                            disabled={editProcessing}
                                        />
                                    </div>

                                    {/* Portfolio Image (Edit Modal) */}
                                    <div className="lg:col-span-2 mt-4">
                                        <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <Image className="w-6 h-6 text-emerald-600" />
                                            Update Portfolio Image
                                        </h4>
                                        <div className="space-y-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleEditServiceImageChange(e.target.files[0] || null)}
                                                className="w-full border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all duration-300 shadow-sm py-4 px-5 text-lg bg-white/50 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-lg file:font-semibold file:bg-gradient-to-r file:from-emerald-600 file:to-emerald-700 file:text-white hover:file:from-emerald-700 hover:file:to-emerald-800"
                                            />
                                        {editImageError && <p className="text-sm font-semibold text-rose-600">{editImageError}</p>}
                                            {editImagePreview && (
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={editImagePreview}
                                                        alt="Preview"
                                                        className="w-24 h-24 object-cover rounded-2xl shadow-lg border-4 border-emerald-200/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditServiceData('image', null);
                                                            setEditImagePreview(null);
                                                            setEditImageError('');
                                                        }}
                                                        className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 font-semibold transition-all"
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-emerald-200">
                                    <button 
                                        type="submit"
                                        disabled={editProcessing}
                                        className="flex-1 sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-400 disabled:to-emerald-500 text-white font-black py-5 px-12 rounded-3xl text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        <CheckCircle size={24} />
                                        {editProcessing ? 'Updating...' : 'Update Service'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        disabled={editProcessing}
                                        className="flex-1 sm:w-auto bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold py-5 px-12 rounded-3xl text-xl shadow-xl hover:shadow-slate-400/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <X size={24} />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
