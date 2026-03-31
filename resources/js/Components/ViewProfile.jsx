import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function ViewProfile({ shop, onClose, onPlaceOrder }) {
    if (!shop) return null;
    
    const { auth } = usePage().props;
    const user = auth?.user || null;
    
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [actionName, setActionName] = useState('');
    
    const requireAuth = useRequireAuth(setShowAuthModal, setActionName);
    
    const services = shop.services || [];
    const attributes = shop.attributes || [];

    const handleProtectedAction = (action) => {
        if (!user) {
            setActionName(action);
            setShowAuthModal(true);
            return;
        }
        window.location.href = `/shop/${shop.id}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-900 to-orchid-purple/10 backdrop-blur-sm p-4">
            <div className="bg-white/95 border border-stone-100/50 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full backdrop-blur-sm max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="p-8 bg-gradient-to-r from-orchid-blue/5 to-orchid-purple/5 border-b border-stone-100/30 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="relative w-24 h-24 rounded-2xl bg-stone-100 ring-4 ring-orchid-blue/20 overflow-hidden flex items-center justify-center">
                                <span className="text-3xl font-black text-stone-800">
                                    {shop.shop_name.split(' ')[0]?.[0] || 'T'}
                                </span>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-stone-900">{shop.shop_name}</h2>
                            <p className="text-orchid-blue/80 text-sm font-medium italic mt-1 leading-relaxed max-w-md">
                                {shop.description || 'Available for custom sewing and repairs.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-2 -m-2 rounded-xl hover:bg-stone-100 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    
                    {/* Unified Symmetrical Service Grid */}
                    <section className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.slice(0, 10).map((s) => {
                                const isRepair = s.service_category.slug?.includes('repairs') || s.service_category.slug?.includes('alterations');
                                
                                return (
                                    <div key={s.id} className="group relative bg-white border border-stone-100 hover:border-orchid-blue/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl flex flex-col h-44">
                                        
                                        {/* Top Row: Badge & Price */}
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-md border ${
                                                isRepair 
                                                    ? 'bg-orchid-purple/5 text-orchid-purple border-orchid-purple/20' 
                                                    : 'bg-orchid-blue/5 text-orchid-blue border-orchid-blue/20'
                                            }`}>
                                                {isRepair ? 'Repair' : 'Custom'}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-stone-900 leading-none">₱{Number(s.price).toFixed(0)}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Starting</p>
                                            </div>
                                        </div>

                                        {/* Middle: Service Info */}
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-stone-800 leading-tight group-hover:text-orchid-blue transition-colors line-clamp-1">
                                                {s.service_name}
                                            </h4>
                                            <p className="text-xs text-stone-500 mt-2 line-clamp-2 italic leading-relaxed">
                                                {s.description || "Inquire for specific details and fabric options."}
                                            </p>
                                        </div>

                                        {/* Bottom: Action Row */}
                                        <div className="mt-4 pt-3 border-t border-stone-50 flex justify-end">
                                            <button 
                                                onClick={() => handleProtectedAction('order')}
                                                className="flex items-center gap-2 text-orchid-blue text-xs font-bold hover:text-orchid-purple transition-all"
                                            >
                                                Select Service
                                                <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center group-hover:bg-orchid-blue transition-colors">
                                                    <span className="text-sm">→</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>


                    {/* Craftsmanship Options */}
                    {attributes.length > 0 && (
                        <section>
                            <h3 className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-6">Materials & Hardware</h3>
                            <div className="flex flex-wrap gap-3">
                                {attributes.slice(0, 12).map((attr) => (
                                    <span key={attr.id} className="bg-stone-100 border border-stone-200 px-4 py-2 rounded-xl text-stone-600 text-sm font-medium">
                                        {attr.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-white border-t border-stone-100 flex justify-end gap-4">
                    <button
                        onClick={() => handleProtectedAction('view shop')}
                        className="px-10 py-4 bg-transparent border border-stone-200 text-stone-600 font-bold rounded-2xl hover:bg-stone-50 transition-all text-sm"
                    >
                        Explore Atelier
                    </button>
                    <button
                        onClick={() => handleProtectedAction('place order')}
                        className="px-10 py-4 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white font-bold rounded-2xl shadow-lg shadow-orchid-purple/20 hover:from-orchid-purple hover:to-orchid-blue transition-all text-sm"
                    >
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
