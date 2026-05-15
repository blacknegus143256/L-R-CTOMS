import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildMapUrl } from '@/utils/map';
import { router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ChevronUp, Trash2, Scissors } from 'lucide-react';
import ViewProfile from '@/Components/ViewProfile';
import "maplibre-gl/dist/maplibre-gl.css";
import LocationMapModal from "@/Components/LocationMapModal";
import HeroSearch from '@/Components/Home/HeroSearch';

import ServiceCarousel from '@/Components/Home/ServiceCarousel';

import MaterialFilters from '@/Components/Home/MaterialFilters';
import ShopActionCard from '@/Components/Home/ShopActionCard';
import { FiMapPin, FiArrowRight, FiShoppingBag } from 'react-icons/fi';

import ComparisonTable from '@/Components/Home/ComparisonTable';
import ShopCoverCarousel from '@/Components/Home/ShopCoverCarousel';

import Footer from '@/Components/Home/Footer';

function ReplaceShopModal({ pendingShop, selectedShops, onReplace, onCancel }) {
    if (!pendingShop) return null;

    return (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-stone-950/40 backdrop-blur-[2px]">
            <div className="absolute inset-0" onClick={onCancel} />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-t-[2.5rem] border-t border-stone-200 bg-white pb-10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)]"
                role="dialog"
                aria-modal="true"
                aria-label="Replace shop comparison modal"
            >
                <div className="flex justify-center py-4">
                    <div className="h-1.5 w-12 rounded-full bg-stone-300" />
                </div>

                <div className="px-8 pt-2">
                    <div className="mb-8 text-center">
                        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.3em] text-orchid-500">Limit Reached</p>
                        <h3 className="text-2xl font-black text-stone-900">
                            Swap a shop to add <span className="text-orchid-600">{pendingShop.shop_name}</span>
                        </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {selectedShops.map((shop) => (
                            <div key={shop.id} className="group relative rounded-3xl border-2 border-stone-100 bg-stone-50/50 p-4 transition-all hover:border-orchid-200 hover:bg-white hover:shadow-xl md:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orchid-blue to-orchid-purple text-xl font-black text-white shadow-inner">
                                        {shop.logo_url ? (
                                            <img
                                                src={`/storage/${shop.logo_url}`}
                                                alt={shop.shop_name}
                                                className="h-full w-full rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling?.style?.removeProperty('display');
                                                }}
                                            />
                                        ) : null}
                                        <span className={shop.logo_url ? 'hidden' : ''}>
                                            {(shop.shop_name || shop.user?.name || 'S').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-widest text-stone-400">Current Comparison</p>
                                        <p className="truncate text-lg font-black text-stone-900">{shop.shop_name}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onReplace(shop)}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-black text-white transition-all hover:bg-orchid-600 hover:shadow-lg active:scale-[0.98]"
                                >
                                    Replace with {pendingShop.shop_name.split(' ')[0]}
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="mt-8 w-full text-center text-sm font-bold text-stone-400 transition-colors hover:text-stone-600"
                    >
                        Nevermind, keep my current selection
                    </button>

                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-200 md:hidden"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}




export default function Home({ auth, categories: initialCategories, services: initialServices, shops: initialShops, serviceCategories: initialServiceCategories = [], uniqueServiceCategories: initialUniqueCategories = [] }) {

    const currentUser = auth.user;

    const categories = initialCategories || [];
    const services = initialServices || [];
    const shops = initialShops || [];

    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [isSelectionListOpen, setIsSelectionListOpen] = useState(false);
    const [pendingShop, setPendingShop] = useState(null);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);

    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedServiceCategories, setSelectedServiceCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);

    // Removed carousel pause and highlight states as ServiceCarousel handles its own auto-scroll
    

    const [openDropdowns, setOpenDropdowns] = useState({});

// Client-side filtering with Inertia props
    const filteredShops = useMemo(() => {
        let filtered = shops;

        // Search filter
        if (search) {
            filtered = filtered.filter(shop => 
                shop.shop_name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Service category filter
        if (selectedServiceCategories.length > 0) {
            filtered = filtered.filter(shop => 
                selectedServiceCategories.some(cat => 
                    shop.services.some(s => s.service_category?.name === cat)
                )
            );
        }

        // Attribute filter
        if (selectedAttributes.length > 0) {
            filtered = filtered.filter(shop => 
                selectedAttributes.some(attrId => 
                    shop.attributes.some(attr => attr.id == attrId)
                )
            );
        }

        return filtered;
    }, [shops, search, selectedServiceCategories, selectedAttributes]);

    // Prevent background scrolling when any modal is active
    useEffect(() => {
        const isAnyModalOpen = showModal || showCompareModal || locationModalOpen || isReplaceModalOpen;
        document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showModal, showCompareModal, locationModalOpen, isReplaceModalOpen]);

    const handleCompareClick = (shop) => {
        setSelectedForCompare(prev => {
            if (prev.find(s => s.id === shop.id)) {
                return prev.filter(s => s.id !== shop.id);
            }
            if (prev.length === 2) {
                setPendingShop(shop);
                setIsReplaceModalOpen(true);
                return prev;
            }
            return [...prev, shop];
        });
    };

    const handleReplaceShop = (shopToReplace) => {
        if (!pendingShop) return;

        setSelectedForCompare(prev => prev
            .filter(shop => shop.id !== shopToReplace.id)
            .concat(pendingShop)
        );
        setPendingShop(null);
        setIsReplaceModalOpen(false);
        setIsSelectionListOpen(false);
    };

    const closeReplaceModal = () => {
        setPendingShop(null);
        setIsReplaceModalOpen(false);
    };

    const uniqueServiceCategories = useMemo(() => {
        const cats = new Set();
        services.forEach(service => {
            const catName = service.service_category?.name;
            if (catName) cats.add(catName);
        });
        return Array.from(cats);
    }, [services]);

    const availableServiceCategories = initialServiceCategories.length > 0
        ? initialServiceCategories
        : (initialUniqueCategories.length > 0 ? initialUniqueCategories : uniqueServiceCategories);

    const getShopInitials = useCallback((name) => {
        if (!name) return 'TS';
        return name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }, []);



    const toggleAttribute = (id) => {
        setSelectedAttributes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleServiceCategory = (category) => {
        setSelectedServiceCategories((prev) =>
            prev.includes(category) ? prev.filter((x) => x !== category) : [...prev, category]
        );
    };

    const clearFilters = () => {
        setSelectedAttributes([]);
        setSelectedServiceCategories([]);
        setSearch('');
    };

    const toggleDropdown = (id) => {
        setOpenDropdowns((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleViewProfile = (shopId) => {
        const shop = filteredShops.find(s => s.id == shopId) || shops.find(s => s.id == shopId);
        setSelectedShop(shop);
        setShowModal(true);
    };

    


    const handleSwapShop = (index) => {
        setShowCompareModal(false);
        setSelectedForCompare(prev => prev.filter((_, i) => i !== index));
    };

    const handlePlaceOrder = (shop, serviceId = null) => {
        const intentUrl = serviceId
            ? `/shop/${shop.id}?order=true&service_id=${serviceId}`
            : `/shop/${shop.id}?order=true`;

        if (!auth.user) {
            router.visit(`/login?redirect=${encodeURIComponent(intentUrl)}`);
            return;
        }

        router.visit(intentUrl);
    };

    const selectedAttributeNames = useMemo(() => {
        const names = [];
        categories.forEach((cat) => {
            (cat.attribute_types || []).forEach((attr) => {
                if (selectedAttributes.includes(attr.id)) {
                    names.push(attr.name);
                }
            });
        });
        return names;
    }, [categories, selectedAttributes]);

    // Removed handleCarouselSelectShop as ServiceCarousel uses service category toggle

    const pageStagger = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.05 },
        },
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 260, damping: 26 },
        },
    };

    const slideFromRight = {
        hidden: { opacity: 0, x: 48 },
        show: {
            opacity: 1,
            x: 0,
            transition: { type: 'spring', stiffness: 280, damping: 28 },
        },
    };

    const unrollLeft = {
        hidden: { opacity: 0, x: -36 },
        show: {
            opacity: 1,
            x: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
        },
    };

    const riseSpring = {
        hidden: { opacity: 0, y: 56 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 220, damping: 22 },
        },
    };

    return (
        <motion.div initial="hidden" animate="show" variants={pageStagger} className="overflow-x-hidden min-h-screen flex flex-col">
            {/* 1. HERO SECTION */}
            <motion.div variants={fadeUp}>
                <HeroSearch auth={auth} currentUser={currentUser} search={search} setSearch={setSearch} />
            </motion.div>

            {/* 2. DISCOVERY CAROUSEL */}
                <motion.div variants={slideFromRight}>
                    <ServiceCarousel
                        categories={availableServiceCategories}
                        toggle={toggleServiceCategory}
                        selected={selectedServiceCategories}
                    />
                </motion.div>



            {/* 4. MAIN INTERACTION AREA (SIDEBAR + TABLE) */}
            <motion.div 
    variants={riseSpring}
className="space-y-8 px-4 max-w-7xl w-full mx-auto mt-6 flex-grow pb-32 lg:pb-24">

                <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
                    {/* COMPARISON ENGINE */}
                    <main className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:order-2">
                        {filteredShops.length === 0 ? (
                            <motion.div
                                variants={fadeUp}
                                className="md:col-span-2 xl:col-span-3"
                            >
                                <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center">
                                    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500 shadow-sm w-full max-w-2xl">
                                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-inner">
                                            <Scissors className="w-7 h-7 text-stone-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-stone-800">No shops found</h3>
                                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-500">
                                            {(() => {
                                                const searchTerm = search.trim();
                                                const serviceSummary = selectedServiceCategories.join(', ');
                                                const materialSummary = selectedAttributeNames.join(', ');

                                                if (!serviceSummary && !materialSummary && searchTerm) {
                                                    return `No shops match the search "${searchTerm}".`;
                                                }

                                                if (!serviceSummary && !materialSummary) {
                                                    return 'No shops are available right now.';
                                                }

                                                const fragments = [];

                                                if (searchTerm) {
                                                    fragments.push(`matching the search "${searchTerm}"`);
                                                }

                                                if (serviceSummary) {
                                                    fragments.push(`offering ${serviceSummary}`);
                                                }

                                                if (materialSummary) {
                                                    fragments.push(`with ${materialSummary}`);
                                                }

                                                return `We couldn't find any shops ${fragments.join(', ')}.`;
                                            })()}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            filteredShops.map((shop) => {
                                // Find ALL services the shop offers that match ANY of the selected categories
                                const matchingServices = selectedServiceCategories.length > 0 
                                    ? shop.services.filter(s => selectedServiceCategories.includes(s.service_category?.name))
                                    : [];
                                // Hide services from the pill list if they are already being showcased in the carousel
                                const servicesWithoutImages = matchingServices.filter(s => !s.image);
                                
                                const mapUrl = shop.google_maps_link || buildMapUrl(shop.user?.profile?.latitude, shop.user?.profile?.longitude);
                                
                                return (
                                    <motion.div
                                        key={shop.id}
                                        variants={fadeUp}
                                        className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-orchid-200 hover:shadow-xl"
                                    >
                                        {/* Integrated Flowbite-Style Image Carousel */}
                                        <ShopCoverCarousel 
                                            shop={shop} 
                                            selectedAttributes={selectedAttributes} 
                                            selectedServiceCategories={selectedServiceCategories}
                                            getShopInitials={getShopInitials}
                                            categories={categories}
                                        />
                                        <div className="p-6 pt-5">
                                            <div className="mb-3 flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-xs font-bold text-stone-600 shadow-sm">
                                                    {shop.user?.profile?.avatar_url ? (
                                                        <img
                                                            src={`/storage/${shop.user.profile.avatar_url}`}
                                                            alt={shop.user?.name || shop.shop_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{getShopInitials(shop.user?.name || shop.shop_name)}</span>
                                                    )}
                                                </div>
                                                <h3 className="truncate text-xl font-bold text-stone-900 transition-colors group-hover:text-orchid-600">
                                                    {shop.shop_name}
                                                </h3>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <div className="mt-1 mb-2 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    </svg>
                                                    {mapUrl ? (
                                                        <a 
                                                            href={mapUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="cursor-pointer truncate text-sm font-medium text-stone-900 hover:text-emerald-700 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={shop.google_maps_link ? "Open in Google Street View" : "View on Google Maps"}
                                                        >
                                                            {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : 'View on Map'}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm font-medium text-stone-600">
                                                            {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : 'Location not available'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {servicesWithoutImages.length > 0 ? (
                                                    servicesWithoutImages.map(ms => (
                                                        <div key={ms.id} className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">
                                                            {ms.service_category?.name} - {ms.service_name}: ₱{ms.price}
                                                        </div>
                                                    ))
                                                ) : (
                                                    matchingServices.length === 0 && (
                                                        <div className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold text-stone-700">
                                                            View Services
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="flex items-center gap-3 border-t border-stone-100 p-4 sm:p-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCompareClick(shop);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                                    selectedForCompare.find(s => s.id === shop.id)
                                                        ? 'border-orchid-200 bg-orchid-50 text-orchid-700 shadow-inner'
                                                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                                                }`}
                                            >
                                                <Scale className="w-4 h-4" /> {selectedForCompare.find(s => s.id === shop.id) ? 'Added' : 'Compare'}
                                            </button>

                                            <button
                                                onClick={() => handleViewProfile(shop.id)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orchid-blue to-orchid-purple px-4 py-3 font-bold text-white"
                                            >
                                                Profile
                                                <FiArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </main>

                    {/* SIDEBAR */}
                    <motion.div 
                        variants={unrollLeft}
                        className="sticky top-6 order-first self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-4 lg:order-1 lg:pr-0 lg:-mr-4 lg:ml-0 scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-transparent"
                    >
                        <MaterialFilters
                            categories={categories}
                            serviceCategories={availableServiceCategories}
                            selectedAttributes={selectedAttributes}
                            selectedServiceCategories={selectedServiceCategories}
                            toggleAttribute={toggleAttribute}
                            toggleServiceCategory={toggleServiceCategory}
                            toggleDropdown={toggleDropdown}
                            openDropdowns={openDropdowns}
                            clearFilters={clearFilters}
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* 5. MODALS AND FOOTER */}
            {showModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
                    <ViewProfile shop={selectedShop} onClose={() => setShowModal(false)} onPlaceOrder={handlePlaceOrder} />
                </div>
            )}
            
            {locationModalOpen && selectedLocation && (
                <LocationMapModal locations={selectedLocation} onClose={() => setLocationModalOpen(false)} />
            )}
            <AnimatePresence>
                {isReplaceModalOpen && pendingShop && (
                    <ReplaceShopModal
                        pendingShop={pendingShop}
                        selectedShops={selectedForCompare}
                        onReplace={handleReplaceShop}
                        onCancel={closeReplaceModal}
                    />
                )}
            </AnimatePresence>
            {selectedForCompare.length > 0 && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-sm border-t border-stone-200 p-4 shadow-2xl"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        {/* Left: Shop Avatars & Count */}
                        <div className="flex items-center gap-3 flex-1">
                            {/* Shopping Bag Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orchid-50 border border-orchid-200 flex-shrink-0">
                                <FiShoppingBag className="w-5 h-5 text-orchid-purple" />
                            </div>

                            {/* Shop Avatars */}
                            <div className="flex items-center -space-x-3">
                                {selectedForCompare.map((shop, idx) => (
                                    <div
                                        key={shop.id}
                                        className="relative w-10 h-10 flex-shrink-0 group"
                                        title={`Click to remove ${shop.shop_name}`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-orchid-blue to-orchid-purple border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:shadow-lg transition-shadow cursor-pointer"
                                            title={shop.shop_name}
                                        >
                                            {shop.logo_url ? (
                                                <img
                                                    src={`/storage/${shop.logo_url}`}
                                                    alt={shop.shop_name}
                                                    className="w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling?.style?.removeProperty('display');
                                                    }}
                                                />
                                            ) : null}
                                            <span className={shop.logo_url ? 'hidden' : ''}>
                                                {(shop.shop_name || shop.user?.name || 'S').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        {/* Remove Button - Always visible at opacity-80 */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedForCompare(prev => prev.filter(s => s.id !== shop.id));
                                            }}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity hover:bg-rose-600 border border-white shadow-md"
                                            title={`Click to remove ${shop.shop_name}`}
                                            aria-label={`Remove ${shop.shop_name} from comparison`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Manage Selection Button */}
                            <button
                                onClick={() => setIsSelectionListOpen(!isSelectionListOpen)}
                                className="flex items-center gap-1 text-sm font-semibold text-stone-700 ml-2 hover:text-orchid-600 transition-colors group"
                                title="View and manage selected shops"
                            >
                                <span>{selectedForCompare.length} selected</span>
                                <ChevronUp 
                                    className={`w-4 h-4 transition-transform ${isSelectionListOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Clear All Button */}
                            <button
                                onClick={() => setSelectedForCompare([])}
                                className="px-4 py-2.5 text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300 flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Clear All
                            </button>

                            {/* Compare Button */}
                            <button
                                disabled={selectedForCompare.length < 2}
                                onClick={() => setShowCompareModal(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-orchid-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Scale className="w-4 h-4" />
                                Compare
                            </button>
                        </div>
                    </div>

                    {/* Selection List Popover */}
                    <AnimatePresence>
                        {isSelectionListOpen && (
                            <motion.div
                                key="selection-list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
                            >
                                <div className="max-w-7xl mx-auto">
                                    <div className="p-4 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {selectedForCompare.map((shop) => (
                                            <div
                                                key={shop.id}
                                                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                                            >
                                                {/* Shop Avatar */}
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orchid-blue to-orchid-purple flex items-center justify-center text-white font-bold text-xs flex-shrink-0 border border-white shadow-sm">
                                                    {shop.logo_url ? (
                                                        <img
                                                            src={`/storage/${shop.logo_url}`}
                                                            alt={shop.shop_name}
                                                            className="w-full h-full rounded-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling?.style?.removeProperty('display');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <span className={shop.logo_url ? 'hidden' : ''}>
                                                        {(shop.shop_name || shop.user?.name || 'S').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Shop Name */}
                                                <span className="flex-1 font-semibold text-stone-800 truncate">
                                                    {shop.shop_name}
                                                </span>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedForCompare(prev => prev.filter(s => s.id !== shop.id));
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title={`Remove ${shop.shop_name}`}
                                                    aria-label={`Remove ${shop.shop_name} from comparison`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Remove</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
{showCompareModal && (
    <div
        className="fixed inset-0 z-[70] isolate flex items-start justify-center bg-stone-900/60 backdrop-blur-sm p-4 sm:p-6 sm:pt-12"
        onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}
    >
        <div className="bg-white w-[95vw] max-w-7xl min-w-[320px] mx-auto max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-stone-900">Shop Comparison</h2>
                    <p className="text-sm text-stone-500 mt-1">Comparing services, prices, and materials.</p>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold transition-colors">
                    ✕
                </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-stone-50/50">
                <ComparisonTable
                    compareLoading={false}
                    compareShops={selectedForCompare}
                    categories={categories}
                    uniqueServiceCategories={uniqueServiceCategories}
                    onViewProfile={handleViewProfile}
                    onPlaceOrder={handlePlaceOrder}
                    onOpenLocationMap={(loc) => {
                        setSelectedLocation(loc);
                        setLocationModalOpen(true);
                    }}
                    onSwapShop={handleSwapShop}
                />
            </div>
        </div>
    </div>
)}
            <Footer />
        </motion.div>
    );
}

