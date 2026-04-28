import React, { useState } from 'react';
import { buildMapUrl } from '@/utils/map';
import { Link, usePage } from '@inertiajs/react';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function ViewProfile({ shop, onClose, onPlaceOrder }) {
    if (!shop) return null;
    
    const { auth } = usePage().props;
    const user = auth?.user || null;
    
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [actionName, setActionName] = useState('');
    
    const requireAuth = useRequireAuth(setShowAuthModal, setActionName);
    
    const handleProtectedAction = (action) => {
        if (!user) {
            setActionName(action);
            setShowAuthModal(true);
            return;
        }
        window.location.href = `/shop/${shop.id}`;
    };

    // Safely group attributes
    const groupedAttributes = shop.attributes?.reduce((acc, attr) => {
        const catName = attr.attributeCategory?.name || attr.attribute_category?.name || 'Uncategorized';
        const typeName = attr.name || 'Generic';

        if (!acc[catName]) acc[catName] = {};
        if (!acc[catName][typeName]) acc[catName][typeName] = [];

        acc[catName][typeName].push(attr);
        return acc;
    }, {}) || {};

    return (
<div className="fixed inset-0 z-[100] isolate flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/50 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-stone-600 transition-all shadow-sm"
                >
                    ✕
                </button>

                {/* Hero / Cover Section */}
                <div className="h-40 sm:h-56 bg-gradient-to-br from-orchid-purple/20 via-orchid-blue/20 to-stone-100 relative">
                    {shop.image_url && (
                        <img src={shop.image_url} alt="Cover" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    )}
                </div>

                {/* Profile Info (Overlapping Cover) */}
                <div className="px-8 sm:px-12 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row sm:items-end gap-6 mb-8">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white p-2 rounded-[2rem] shadow-xl flex-shrink-0">
{(shop.logo_url || shop.user?.profile?.avatar_url) ? (
                            <img src={`/storage/${shop.logo_url || shop.user?.profile?.avatar_url}`} alt={shop.shop_name} className="w-full h-full rounded-[1.5rem] object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orchid-purple to-orchid-blue rounded-[1.5rem] flex items-center justify-center text-white font-black text-4xl shadow-inner">
                                {(shop.user?.name || shop.shop_name).substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="pb-2">
                        <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">{shop.shop_name}</h2>
                        
                        <div className="flex items-center gap-1.5 mt-2 mb-2">
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            {(() => {
                                const mapUrl = buildMapUrl(shop.user?.profile?.latitude, shop.user?.profile?.longitude);
                                return mapUrl ? (
                                    <a 
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-stone-600 font-medium truncate hover:text-emerald-700 hover:underline cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                        title="View on Google Maps"
                                    >
                                        {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : 'View on Map'}
                                    </a>
                                ) : (
                                    <span className="text-sm text-stone-600 font-medium truncate">
                                        {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : "Location not specified"}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-8 sm:px-12 pb-8 custom-scrollbar">
                    
                    {/* 1. Services Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">Available Services</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{shop.services && shop.services.length > 0 ? shop.services.map(service => (
<div key={service.id} className="border-2 border-stone-100 rounded-[1.5rem] overflow-hidden hover:border-orchid-200 transition-all bg-white group flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1">
    
    {/* Service Image Banner */}
    <div className="h-32 w-full relative bg-stone-100 overflow-hidden shrink-0">
        <img 
            src={(service.image || service.image_url || service.service_image) ? ((service.image || service.image_url || service.service_image).startsWith('http') ? (service.image || service.image_url || service.service_image) : `/storage/${service.image || service.image_url || service.service_image}`) : '/images/default-service.jpg'} 
            alt={service.service_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/images/default-service.jpg';
            }}
        />
        <div className="absolute top-3 left-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
                {service.serviceCategory?.name || service.service_category?.name || 'Custom'}
            </span>
        </div>
    </div>
    
    {/* Service Details */}
    <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 gap-2">
            <h4 className="font-bold text-stone-800 text-lg leading-tight line-clamp-2 group-hover:text-orchid-600 transition-colors">
                {service.service_name}
            </h4>
            <span className="font-black text-emerald-600 shrink-0 text-lg">₱{Number(service.price).toFixed(2)}</span>
        </div>
        <p className="text-xs text-stone-500 line-clamp-2 mb-4 flex-1 mt-1">
            {service.service_description || 'Inquire for specific details and fabric options.'}
        </p>
        
        {/* Direct Order Button */}
        <button
            onClick={() => onPlaceOrder(shop, service.id)}
            className="w-full mt-auto py-2.5 bg-stone-50 hover:bg-orchid-50 text-stone-600 hover:text-orchid-700 font-bold rounded-xl text-sm transition-colors flex justify-center items-center gap-2 border border-stone-100 hover:border-orchid-200"
        >
            Create Order
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
    </div>
</div>
                )) : (
                    <p className="text-sm text-stone-400 italic col-span-full">No services listed yet.</p>
                )}
                        </div>
                    </div>

                    {/* 2. Materials & Inventory Section */}
                    <div className="mb-8 mt-10">
                        <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-6">Available Materials & Items</h3>
                        {shop.attributes && shop.attributes.length > 0 ? (
                            <div className="space-y-12">
                                {Object.entries(groupedAttributes).map(([category, types]) => (
                                    <div key={category} className="space-y-8">
                                        {/* Category Header */}
                                        <h4 className="text-2xl font-black text-stone-900 border-b-2 border-stone-100 pb-3 flex items-center gap-3">
                                            <span className="w-2 h-8 bg-emerald-400 rounded-full"></span>
                                            {category}
                                        </h4>
                                        
                                        {/* Types Wrapper */}
                                        <div className="space-y-8 pl-2 sm:pl-4">
                                            {Object.entries(types).map(([typeName, attrs]) => (
                                                <div key={typeName} className="space-y-4">
                                                    {/* Type Sub-Header */}
                                                    <h5 className="text-md font-bold text-stone-700 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                        {typeName}
                                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 ml-1">
                                                            {attrs.length} ITEM{attrs.length !== 1 ? 'S' : ''}
                                                        </span>
                                                    </h5>

                                                    {/* Items Grid for this Specific Type */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                        {attrs.map((attr, idx) => (
                                                            <div key={attr.pivot?.id || `${attr.id}-${idx}`} className="group bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col">
                                                                {/* Image Container */}
                                                                <div className="h-32 bg-stone-200 relative overflow-hidden flex-shrink-0">
                                                                    {attr.pivot?.image_url ? (
                                                                        <img 
                                                                            src={`/storage/${attr.pivot.image_url}`} 
                                                                            alt={attr.pivot?.item_name || attr.name} 
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                                            onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                                                                            <span className="text-2xl mb-1">📷</span>
                                                                            <span className="text-[9px] font-bold uppercase tracking-wider">No Image</span>
                                                                        </div>
                                                                    )}
                                                                    {/* Out of Stock Overlay */}
                                                                    {!attr.pivot?.is_available && (
                                                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                                            <span className="px-3 py-1 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Out of Stock</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Details Container */}
                                                                <div className="p-4 bg-white flex-1 flex flex-col">
                                                                    <h6 className="font-bold text-stone-900 text-sm mb-2 leading-tight line-clamp-2" title={attr.pivot?.item_name || attr.name}>
                                                                        {attr.pivot?.item_name || attr.name}
                                                                    </h6>
                                                                    <div className="flex items-baseline gap-1 mt-auto pt-2">
                                                                        <span className="font-black text-emerald-700">₱{Number(attr.pivot?.price || 0).toFixed(2)}</span>
                                                                        <span className="text-[10px] font-bold text-stone-400 uppercase">/ {attr.pivot?.unit || 'unit'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-stone-400 italic">No materials or items listed yet.</p>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-stone-100 bg-stone-50/80 backdrop-blur-md flex justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-stone-600 hover:bg-stone-200 transition-colors">
                        Close
                    </button>
                    <button onClick={() => onPlaceOrder(shop, null)} className="px-8 py-3 rounded-xl font-black text-white bg-gradient-to-r from-orchid-blue to-orchid-purple hover:from-orchid-blue/90 hover:to-orchid-purple/90 shadow-lg hover:shadow-orchid-500/30 transition-all hover:-translate-y-0.5">
                        Start Order
                    </button>
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl">
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">Authentication Required</h3>
                        <p className="text-stone-500 mb-8 leading-relaxed">Please sign in to place an order at {shop.shop_name}.</p>
                        <div className="space-y-4">
                            <Link 
                                href="/login" 
                                className="w-full block py-4 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white font-bold rounded-2xl text-center shadow-lg hover:shadow-orchid-blue/20 transition-all"
                            >
                                Sign In
                            </Link>
                            <Link 
                                href="/register" 
                                className="w-full block py-4 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl text-center hover:bg-stone-50 transition-all"
                            >
                                Create Profile
                            </Link>
                            <button onClick={() => setShowAuthModal(false)} className="w-full text-stone-400 text-sm font-medium mt-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}