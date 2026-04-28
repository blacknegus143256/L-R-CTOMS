import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Camera, Image as ImageIcon } from 'lucide-react';

const TailorShowcase = ({ currentOrder }) => {
    const [photoPreview, setPhotoPreview] = useState(null);
    
    // Setup Inertia form
    const { data, setData, post, processing, errors, reset } = useForm({
        image: null,
        caption: '',
    });

    const handlePhotoSubmit = (e) => {
        e.preventDefault();
        // Post to your actual photo upload route
        post(`/store/orders/${currentOrder.id}/photos`, {
            preserveScroll: true,
            forceFormData: true, // Required for files
            onSuccess: () => {
                reset();
                setPhotoPreview(null);
                router.reload({ preserveScroll: true });
            },
        });
    };

    return (
        <div className="space-y-8">
            {/* Upload Form */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-orchid-600" />
                        Upload Progress Photo
                    </h4>
                    <p className="text-sm text-stone-500 mt-1">
                        Uploading a photo will automatically move this order to "In Progress" if it is currently Confirmed.
                    </p>
                </div>

                <form onSubmit={handlePhotoSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Photo</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setData('image', file);
                                    setPhotoPreview(URL.createObjectURL(file));
                                }
                            }}
                            className="w-full text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orchid-50 file:text-orchid-700 hover:file:bg-orchid-100 transition-all cursor-pointer"
                        />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                    </div>
                    
                    {photoPreview && (
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-orchid-200 shadow-sm">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Caption (Optional)</label>
                        <input 
                            type="text" 
                            value={data.caption}
                            onChange={(e) => setData('caption', e.target.value)}
                            placeholder="e.g., Front panels stitched together"
                            className="w-full rounded-xl border-stone-200 focus:border-orchid-500 focus:ring focus:ring-orchid-200 transition-all text-sm py-2.5 px-4"
                        />
                        {errors.caption && <p className="text-red-500 text-xs mt-1">{errors.caption}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing || !data.image}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex justify-center items-center gap-2 ${
                            processing || !data.image 
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                        }`}
                    >
                        {processing ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </form>
            </div>

            {/* Display Gallery */}
            <div>
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-stone-500" />
                    Order Gallery
                </h4>
                {currentOrder.images && currentOrder.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {currentOrder.images.map((photo, idx) => (
                            <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200">
                                <img 
                                    src={`/storage/${photo.image_path}`} 
                                    alt="Progress" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <span className="text-white text-xs font-medium truncate">{photo.caption || 'Update'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed border-stone-200 rounded-2xl text-center">
                        <p className="text-stone-500 text-sm">No photos uploaded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TailorShowcase;
