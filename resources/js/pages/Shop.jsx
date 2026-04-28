import { useState, useMemo, useEffect } from "react";
import { buildMapUrl } from '@/utils/map';
import { Link, usePage, router } from "@inertiajs/react";
import { Head } from '@inertiajs/react';
import OrderModal from "@/Components/OrderModal";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiPlus } from 'react-icons/fi';

export default function Shop({ shop, auth }) {
    if (!shop) return null;

    const { url } = usePage();
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);

    useEffect(() => {
        if (url.includes('order=true')) setShowOrderForm(true);
    }, [url]);

    const services = shop.services || [];
    




        const content = (
        <div className="min-h-screen bg-stone-50">
            {/* 1. HERO HEADER */}
            <div className="bg-stone-900 pt-12 pb-20 px-6 relative overflow-hidden">
                {/* Orchid Glow Effect */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orchid-purple/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-orchid-blue font-bold text-sm mb-8 hover:text-orchid-purple transition-all">
                        <span className="text-lg">←</span> Back to Discovery
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
<div className="flex items-center gap-4 mb-4">
    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-inner flex items-center justify-center">
{(shop.logo_url || shop.user?.profile?.avatar_url) ? (
            <img src={`/storage/${shop.logo_url || shop.user?.profile?.avatar_url}`} alt={shop.shop_name} className="w-full h-full object-cover" />
        ) : (
            <span className="text-2xl font-black text-stone-300 uppercase">{(shop.user?.name || shop.shop_name)?.charAt(0) || 'S'}</span>
        )}
    </div>
    <h1 className="text-5xl font-black text-white tracking-tighter">{shop.shop_name}</h1>
</div>
                            
                            {/* New Contact & Location Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6">
                                {/* Location */}
                                <div className="flex items-center gap-2 text-orchid-blue/90 font-medium">
                                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {(() => {
                                        const mapUrl = buildMapUrl(shop.user?.profile?.latitude, shop.user?.profile?.longitude);
                                        return mapUrl ? (
                                            <a 
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-emerald-300 hover:underline transition-colors truncate max-w-[250px] sm:max-w-none"
                                            >
                                                {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : 'View on Map'}
                                            </a>
                                        ) : (
                                            <span className="truncate max-w-[250px] sm:max-w-none">
                                                {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : "Location not specified"}
                                            </span>
                                        );
                                    })()}
                                </div>
                                
                                {/* Phone */}
                                <div className="flex items-center gap-2 text-orchid-blue/90 font-medium">
                                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    <span>{shop.user?.profile?.phone || "No phone provided"}</span>
                                </div>
                            </div>

                            <p className="text-white/60 text-lg italic max-w-2xl leading-relaxed mb-6">
                                {shop.description || "Expert tailoring and garment restoration services."}
                            </p>
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 w-fit pr-6 p-2 rounded-full backdrop-blur-sm mb-6">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center shrink-0">
                                    {shop.user?.profile?.avatar_url ? (
                                        <img src={`/storage/${shop.user.profile.avatar_url}`} alt="Owner" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-stone-500 font-bold uppercase">
                                            {(shop.user?.name || 'O').charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-black leading-none mb-1">Tailored By</p>
                                    <p className="text-white font-medium text-sm leading-none">{shop.user?.name || 'Shop Owner'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                                <span className="block text-[10px] text-stone-400 uppercase font-black tracking-widest">Status</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Open for Orders
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT GRID (Now Stacked & Full Width) */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 pb-24">
                
                {/* SERVICES MENU */}
                <div className="mb-16 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-stone-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black text-stone-900">Services Menu</h2>
                        <span className="text-sm text-stone-400 font-bold px-3 py-1 bg-stone-100 rounded-lg">{services.length} options available</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{services.map((s) => {
        const category = s.service_category || s.serviceCategory;
        const isRepair = category?.slug?.includes('repairs') || category?.slug?.includes('alterations');
        const categoryName = category?.name || 'Custom';
        
        return (
            <div key={s.id} className="bg-white border-2 border-stone-100 hover:border-orchid-blue/40 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orchid-blue/10 flex flex-col group hover:-translate-y-1">
            
            {/* Image Header */}
            <div className="h-48 w-full relative overflow-hidden bg-stone-100 shrink-0">
                    <img 
                    src={(s.image || s.image_url || s.service_image) ? ((s.image || s.image_url || s.service_image).startsWith('http') ? (s.image || s.image_url || s.service_image) : `/storage/${s.image || s.image_url || s.service_image}`) : '/images/default-service.jpg'} 
                    alt={s.service_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = '/images/default-service.jpg';
    
                    }}
                />
                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 z-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${
                            isRepair ? 'bg-orchid-purple/90 text-white border-white/20' : 'bg-orchid-blue/90 text-white border-white/20'
    
                    }`}>
                        {isRepair ? 'Repair' : 'Custom'}
                    </span>
                </div>
            </div>
            {/* Content Body */}
            <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-4">
                        <h4 className="text-xl font-bold text-stone-900 group-hover:text-orchid-blue transition-colors leading-tight line-clamp-2">
                            {s.service_name}
                        </h4>
                    <span className="text-2xl font-black text-emerald-600 shrink-0">
                            ₱{Number(s.price).toFixed(0)}
                        </span>
                </div>
                
                <div className="flex-1 mb-6 mt-2">
                        <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed">
                            {s.description || "Professional garment tailoring with premium finishing."}
                        </p>
                </div>
                
                <button 
                    onClick={() => {
                            router.visit(window.location.pathname + `?order=true&service_id=${s.id}`, { preserveScroll: true });
                    }} 
                    className="w-full py-3.5 bg-stone-50 hover:bg-orchid-50 text-stone-600 hover:text-orchid-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 border border-stone-200 hover:border-orchid-200 mt-auto"
                >
                        Create Order
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
            
        </div>
    );
})}
                    </div>
                </div>

                {/* CUSTOMIZATION LIBRARY */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-stone-900 mb-8 pl-2">Customization Library</h2>
                    {shop.attributes && shop.attributes.length > 0 ? (
                        <div className="space-y-16">
                            {Object.entries(
                                shop.attributes.reduce((acc, attr) => {
                                    const catName = attr.attribute_category?.name || attr.attributeCategory?.name || 'Uncategorized';
                                    const typeName = attr.name || 'Generic';
                                    if (!acc[catName]) acc[catName] = {};
                                    if (!acc[catName][typeName]) acc[catName][typeName] = [];
                                    acc[catName][typeName].push(attr);
                                    return acc;
                                }, {})
                            ).map(([category, types]) => (
                                <div key={category} className="space-y-8 bg-white/40 p-6 sm:p-8 rounded-3xl border border-stone-200/60 shadow-sm">
                                    {/* Category Header */}
                                    <h4 className="text-3xl font-black text-stone-800 border-b-2 border-stone-200/50 pb-4 flex items-center gap-4">
                                        <span className="w-3 h-10 bg-emerald-400 rounded-full shadow-sm"></span>
                                        {category}
                                    </h4>
                                    
                                    {/* Types Wrapper */}
                                    <div className="space-y-10 pl-2 sm:pl-6">
                                        {Object.entries(types).map(([typeName, attrs]) => (
                                            <div key={typeName} className="space-y-6">
                                                {/* Type Sub-Header */}
                                                <h5 className="text-xl font-bold text-stone-700 flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                                    {typeName}
                                                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 ml-2 shadow-sm">
                                                        {attrs.length} ITEM{attrs.length !== 1 ? 'S' : ''}
                                                    </span>
                                                </h5>

                                                {/* Items Grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                                                    {attrs.map((attr, idx) => (
                                                        <div key={attr.pivot?.id || `${attr.id}-${idx}`} className="group bg-white border-2 border-stone-100 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col hover:-translate-y-1">
                                                            {/* Image */}
                                                            <div className="h-40 bg-stone-100 relative overflow-hidden flex-shrink-0">
                                                                {attr.pivot?.image_url ? (
                                                                    <img 
                                                                        src={`/storage/${attr.pivot.image_url}`} 
                                                                        alt={attr.pivot?.item_name || attr.name} 
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                                        onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100/50">
                                                                        <span className="text-3xl mb-2 opacity-50">📷</span>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">No Image</span>
                                                                    </div>
                                                                )}
                                                                {!attr.pivot?.is_available && (
                                                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                                                                        <span className="px-4 py-1.5 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Out of Stock</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Details */}
                                                            <div className="p-5 flex-1 flex flex-col">
                                                                <h6 className="font-bold text-stone-900 text-base mb-3 leading-tight line-clamp-2">
                                                                    {attr.pivot?.item_name || attr.name}
                                                                </h6>
                                                                <div className="flex items-end justify-between mt-auto pt-2 border-t border-stone-50">
                                                                    <span className="font-black text-emerald-600 text-lg">₱{Number(attr.pivot?.price || 0).toFixed(2)}</span>
                                                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">/ {attr.pivot?.unit || 'unit'}</span>
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
                        <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl mb-4 opacity-50">📦</span>
                            <h3 className="text-lg font-bold text-stone-700 mb-2">No Customization Items</h3>
                            <p className="text-stone-500">This shop hasn't added any fabrics or materials yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. SYSTEM FAB (ORCHID THEME) */}
            <button
                onClick={() => setShowOrderForm(true)}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-orchid-blue to-orchid-purple px-8 py-4 rounded-2xl text-white font-bold shadow-2xl shadow-orchid-blue/30 hover:scale-105 active:scale-95 transition-all"
            >
                <FiPlus className="w-6 h-6" />
                Place Custom Order
            </button>

            <OrderModal
                shop={shop}
                isOpen={showOrderForm}
                onClose={() => setShowOrderForm(false)}
            />
        </div>
    );

    // If logged in, show with Sidebar. If not, show plain.
    if (auth.user) {
        return (
            <AuthenticatedLayout 
                header={shop.shop_name}
            >
                {content}
            </AuthenticatedLayout>
        );
    }

    return content;
}

