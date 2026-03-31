import { useState, useMemo, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Head } from '@inertiajs/react';
import OrderModal from "@/Components/OrderModal";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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
    
    const attributesByCategory = useMemo(() => {
        if (!shop?.attributes) return {};
        const grouped = {};
        shop.attributes.forEach(attr => {
            const catName = attr.attribute_category?.name || attr.attributeCategory?.name || "Other";
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(attr);
        });
        return grouped;
    }, [shop]);

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
                            <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                                {shop.shop_name}
                            </h1>
                            <p className="text-orchid-blue/70 text-lg italic max-w-2xl leading-relaxed">
                                {shop.description || "Expert tailoring and garment restoration services."}
                            </p>
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

            {/* 2. MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-6 -mt-10">
                <div className="grid lg:grid-cols-3 gap-10">
                    
                    {/* LEFT: UNIFIED SERVICE GRID (2 Cols wide) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black text-stone-900">Services Menu</h2>
                            <span className="text-sm text-stone-400 font-medium">{services.length} options available</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {services.map((s) => {
                                const isRepair = s.service_category?.slug?.includes('repairs') || s.service_category?.slug?.includes('alterations');
                                return (
                                    <div key={s.id} className="bg-white border border-stone-200 hover:border-orchid-blue/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-orchid-blue/5 flex flex-col h-52 group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                                isRepair ? 'bg-orchid-purple/5 text-orchid-purple border-orchid-purple/20' : 'bg-orchid-blue/5 text-orchid-blue border-orchid-blue/20'
                                            }`}>
                                                {isRepair ? 'Repair' : 'Custom'}
                                            </span>
                                            <span className="text-2xl font-black text-stone-900">₱{Number(s.price).toFixed(0)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-stone-800 group-hover:text-orchid-blue transition-colors">{s.service_name}</h4>
                                            <p className="text-xs text-stone-500 mt-2 line-clamp-3 leading-relaxed">
                                                {s.description || "Professional garment tailoring with premium finishing."}
                                            </p>
                                        </div>
                                        <button onClick={() => setShowOrderForm(true)} className="mt-4 text-orchid-blue text-xs font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                            Configure Order <span className="text-lg">→</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: CUSTOMIZATION LIBRARY */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-stone-900">Library</h2>
                        <div className="space-y-6">
                            {Object.entries(attributesByCategory).map(([category, attrs]) => (
                                <div key={category} className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 border-b border-stone-50 pb-2">
                                        {category}
                                    </h3>
                                    <div className="space-y-3">
                                        {attrs.map(attr => (
                                            <div key={attr.id} className="flex justify-between items-center group">
                                                <span className="text-sm font-bold text-stone-700 group-hover:text-orchid-blue transition-colors">{attr.name}</span>
                                                <span className="text-xs font-black text-stone-400">
                                                    {attr.pivot?.price ? `+₱${Number(attr.pivot.price).toFixed(0)}` : 'STOCK'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. SYSTEM FAB (ORCHID THEME) */}
            <button
                onClick={() => setShowOrderForm(true)}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-orchid-blue to-orchid-purple px-8 py-4 rounded-2xl text-white font-bold shadow-2xl shadow-orchid-blue/30 hover:scale-105 active:scale-95 transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
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

