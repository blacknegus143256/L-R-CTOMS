import { useState, useMemo, useEffect } from "react";
import { Zap, Flag, ChevronRight, CalendarDays, Ruler, ImageOff, ArrowLeft, MapPin, Phone, Package } from 'lucide-react';
import ReportModal from '@/Components/ReportModal';
import { buildMapUrl } from '@/utils/map';
import { SERVICE_PLACEHOLDER_IMAGE } from '@/utils/servicePlaceholder';
import { Link, usePage, router } from "@inertiajs/react";
import { Head } from '@inertiajs/react';
import OrderModal from "@/Components/OrderModal";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiPlus } from 'react-icons/fi';

export default function Shop({ shop, auth, fitMethods = [], holidays = [] }) {
    if (!shop) return null;

    const { url } = usePage();
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    const formatCurrency = (value) => `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const normalizeDisplayName = (value, fallback = 'Shop Item') => {
        let displayName = value || fallback;

        if (displayName.includes(' - ')) {
            const parts = displayName.split(' - ');
            if (parts[0].trim() === parts[1].trim()) {
                displayName = parts[0].trim();
            }
        }

        return displayName;
    };

    const toggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    useEffect(() => {
        if (url.includes('order=true')) setShowOrderForm(true);
    }, [url]);

    useEffect(() => {
        if (!auth?.user && url.includes('order=true')) {
            router.visit(`/login?redirect=${encodeURIComponent(url)}`);
        }
    }, [auth?.user, url]);

    const services = shop.services || [];
    




        const content = (
        <div className="min-h-screen bg-stone-50">
            {/* 1. HERO HEADER */}
            <div className="bg-stone-900 pt-12 pb-20 px-6 relative overflow-hidden">
                {/* Orchid Glow Effect */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orchid-purple/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-orchid-blue font-bold text-sm mb-8 hover:text-orchid-purple transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Discovery
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
    <div className="flex items-center gap-3">
        <h1 className="text-5xl font-black text-white tracking-tighter">{shop.shop_name}</h1>
        {auth?.user && auth.user.id !== shop.user?.id && (
            <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/6 hover:bg-white/10 text-white/90 text-sm font-semibold border border-white/10"
            >
                <Flag className="w-4 h-4" />
                Report
            </button>
        )}
    </div>
</div>
                            
                            {/* New Contact & Location Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6">
                                {/* Location */}
                                <div className="flex items-center gap-2 text-orchid-blue/90 font-medium">
                                        <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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
                                    <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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
    const displayName = normalizeDisplayName(s.service_name, 'Service');
        // Normalize image source: support full URLs, already-prefixed '/storage/...', or raw filenames
        const rawImage = s.image || s.image_url || s.service_image;
        let imageSrc;
        if (rawImage) {
            if (rawImage.startsWith('http')) {
                imageSrc = rawImage;
            } else if (rawImage.startsWith('/storage/')) {
                imageSrc = rawImage;
            } else {
                // strip leading slashes to avoid double slashes
                imageSrc = `/storage/${rawImage.replace(/^\/+/, '')}`;
            }
        } else {
            imageSrc = SERVICE_PLACEHOLDER_IMAGE;
        }
        return (
            <div key={s.id} className="bg-white border-2 border-stone-100 hover:border-orchid-blue/40 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orchid-blue/10 flex flex-col group hover:-translate-y-1">
            
            {/* Image Header */}
            <div className="h-48 w-full relative overflow-hidden bg-stone-100 shrink-0">
                    <img
                        src={imageSrc}
                        alt={displayName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            e.currentTarget.src = SERVICE_PLACEHOLDER_IMAGE;
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
                            {displayName}
                        </h4>
                    <span className="text-2xl font-black text-emerald-600 shrink-0">
                            {formatCurrency(s.price)}
                        </span>
                </div>
                {s.rush_service_available && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mb-3">
                    <Zap size={14} />
                    Rush Available
                  </div>
                )}
                
                {/* Measurement Preference Badge */}
                {s.appointment_required ? (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                        <CalendarDays className="w-3 h-3" />
                        Appointment Required
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                        <Ruler className="w-3 h-3" />
                        Self-Measure Available
                    </span>
                )}
                
                <div className="flex-1 mb-6 mt-2">
                        <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed">
                            {s.description || "Professional garment tailoring with premium finishing."}
                        </p>
                </div>
                
                <button 
                    onClick={() => {
                            const intentUrl = `${window.location.pathname}?order=true&service_id=${s.id}`;
                            if (!auth?.user) {
                                router.visit(`/login?redirect=${encodeURIComponent(intentUrl)}`);
                                return;
                            }

                            router.visit(intentUrl, { preserveScroll: true });
                    }} 
                    className="w-full py-3.5 bg-stone-50 hover:bg-orchid-50 text-stone-600 hover:text-orchid-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 border border-stone-200 hover:border-orchid-200 mt-auto"
                >
                        Create Order
                        <ChevronRight className="w-4 h-4" />
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
                                    let typeName = attr.name || 'Generic';
                                    if (typeName.includes(' - ')) {
                                        const parts = typeName.split(' - ');
                                        if (parts[0].trim() === parts[1].trim()) {
                                            typeName = parts[0].trim();
                                        }
                                    }
                                    if (!acc[catName]) acc[catName] = {};
                                    if (!acc[catName][typeName]) acc[catName][typeName] = [];
                                    acc[catName][typeName].push(attr);
                                    return acc;
                                }, {})
                            ).map(([category, types]) => {
                                const isExpanded = expandedCategories[category];

                                return (
                                <div key={category} className="space-y-8 bg-white/40 p-6 sm:p-8 rounded-3xl border border-stone-200/60 shadow-sm">
                                    {/* Category Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between gap-4 pb-4 border-b-2 border-stone-200/50"
                                    >
                                        <span className="text-3xl font-black text-stone-800 flex items-center gap-4 text-left">
                                            <span className="w-3 h-10 bg-emerald-400 rounded-full shadow-sm"></span>
                                            {category}
                                        </span>
                                        <span className="text-stone-500 text-[10px] font-black uppercase flex items-center gap-1">
                                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                            {isExpanded ? 'Hide' : 'Show'}
                                        </span>
                                    </button>
                                    
                                    {/* Types Wrapper */}
                                    {isExpanded && (
                                    <div className="space-y-10 pl-2 sm:pl-6">
                                        {Object.entries(types).map(([typeName, attrs]) => (
                                            <div key={typeName} className="space-y-6">
                                                {/* Type Sub-Header */}
                                                <h5 className="text-xl font-bold text-stone-700 flex items-center gap-3">
                                                    <ChevronRight className="w-5 h-5 text-stone-400" />
                                                    {typeName}
                                                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 ml-2 shadow-sm">
                                                        {attrs.length} ITEM{attrs.length !== 1 ? 'S' : ''}
                                                    </span>
                                                </h5>

                                                {/* Items Grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                                                    {attrs.map((attr, idx) => {
                                                        let displayName = attr.pivot?.item_name || attr.name || 'Shop Item';
                                                        if (displayName.includes(' - ')) {
                                                            const parts = displayName.split(' - ');
                                                            if (parts[0].trim() === parts[1].trim()) {
                                                                displayName = parts[0].trim();
                                                            }
                                                        }

                                                        const price = Number(attr.pivot?.price || attr.price || 0);
                                                        const unit = attr.pivot?.unit || attr.unit || 'unit';
                                                        const imageUrl = attr.pivot?.image_url || attr.image_url;

                                                        return (
                                                            <div key={attr.pivot?.id || `${attr.id}-${idx}`} className="group bg-white border-2 border-stone-100 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col hover:-translate-y-1">
                                                                {/* Image */}
                                                                <div className="h-40 bg-stone-100 relative overflow-hidden flex-shrink-0">
                                                                    {imageUrl ? (
                                                                        <img 
                                                                            src={`/storage/${imageUrl}`} 
                                                                            alt={displayName} 
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                                            onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100/50">
                                                                            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">No Image</span>
                                                                        </div>
                                                                    )}
                                                                    {!attr.pivot?.is_available && (
                                                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                                            <span className="px-3 py-1 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Out of Stock</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Details Container */}
                                                                <div className="p-4 bg-white flex-1 flex flex-col">
                                                                    <h6 className="font-bold text-stone-900 text-sm mb-2 leading-tight line-clamp-2" title={displayName}>
                                                                        {displayName}
                                                                    </h6>
                                                                    <div className="flex items-baseline gap-1 mt-auto pt-2">
                                                                        <span className="font-black text-emerald-700">{formatCurrency(price)}</span>
                                                                        <span className="text-[10px] font-bold text-stone-400 uppercase">/ {unit}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                            <Package className="w-10 h-10 mb-4 opacity-50 text-stone-400" />
                            <h3 className="text-lg font-bold text-stone-700 mb-2">No Customization Items</h3>
                            <p className="text-stone-500">This shop hasn't added any fabrics or materials yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. SYSTEM FAB (ORCHID THEME) */}
            <button
                onClick={() => {
                    const intentUrl = `${window.location.pathname}?order=true`;
                    if (!auth?.user) {
                        router.visit(`/login?redirect=${encodeURIComponent(intentUrl)}`);
                        return;
                    }

                    setShowOrderForm(true);
                }}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-orchid-blue to-orchid-purple px-8 py-4 rounded-2xl text-white font-bold shadow-2xl shadow-orchid-blue/30 hover:scale-105 active:scale-95 transition-all"
            >
                <FiPlus className="w-6 h-6" />
                Place Custom Order
            </button>

            <OrderModal
                shop={shop}
                fitMethods={fitMethods}
                holidays={holidays}
                isOpen={showOrderForm}
                onClose={() => setShowOrderForm(false)}
            />
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedId={shop.user?.id}
                shopId={shop.id}
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

