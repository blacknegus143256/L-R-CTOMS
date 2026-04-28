import React from 'react';
import { Camera } from 'lucide-react';
import { TbCurrencyPeso } from 'react-icons/tb';
const OrderShowcase = ({ currentOrder }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Camera className="w-6 h-6 text-orchid-600" />
                        Order Showcase
                    </h2>
                    <p className="text-stone-500 text-sm mt-1">Photos of your garment's progress and final result.</p>
                </div>
            </div>

            {/* Gallery Grid */}
            {currentOrder.images && currentOrder.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {currentOrder.images.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200 cursor-pointer hover:shadow-xl transition-all duration-300">
                            <img 
                                src={`/storage/${img.image_path || img.url}`} 
                                alt={`Progress photo ${idx + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/default-service.jpg';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-white font-bold text-sm tracking-wide">
                                    {img.caption || 'Progress Photo'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-16 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <Camera className="w-10 h-10 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Photos Yet</h3>
                    <p className="text-stone-500 mt-2 max-w-md mx-auto">
                        The tailor hasn't uploaded any progress photos for this order yet. Check back later once sewing begins!
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderShowcase;

