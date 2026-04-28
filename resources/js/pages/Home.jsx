import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildMapUrl } from '@/utils/map';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ViewProfile from '@/Components/ViewProfile';
import "maplibre-gl/dist/maplibre-gl.css";
import LocationMapModal from "@/Components/LocationMapModal";
import HeroSearch from '@/Components/Home/HeroSearch';

import ServiceCarousel from '@/Components/Home/ServiceCarousel';

import MaterialFilters from '@/Components/Home/MaterialFilters';
import ShopActionCard from '@/Components/Home/ShopActionCard';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';

import ComparisonTable from '@/Components/Home/ComparisonTable';
import ShopCoverCarousel from '@/Components/Home/ShopCoverCarousel';

import Footer from '@/Components/Home/Footer';




export default function Home({ auth, categories: initialCategories, services: initialServices, shops: initialShops, uniqueServiceCategories: initialUniqueCategories }) {

    const currentUser = auth.user;

    const categories = initialCategories || [];
    const services = initialServices || [];
    const shops = initialShops || [];

    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

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
        const isAnyModalOpen = showModal || showCompareModal || locationModalOpen;
        document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showModal, showCompareModal, locationModalOpen]);

    const toggleCompare = (shop) => {
        setSelectedForCompare(prev => {
            if (prev.find(s => s.id === shop.id)) {
                return prev.filter(s => s.id !== shop.id);
            }
            if (prev.length >= 2) {
                return [prev[0], shop];
            }
            return [...prev, shop];
        });
    };

    const uniqueServiceCategories = useMemo(() => {
        const cats = new Set();
        services.forEach(service => {
            const catName = service.service_category?.name;
            if (catName) cats.add(catName);
        });
        return Array.from(cats);
    }, [services]);

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
        if (!auth.user) {
            router.visit('/login');
            return;
        }

        let url = `/shop/${shop.id}?order=true`;
        if (serviceId) {
            url += `&service_id=${serviceId}`;
        }
        
        // This sends them to your Shop page and triggers the modal automatically
        // with the specific service_id in the URL
        router.visit(url);
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
                        categories={initialUniqueCategories?.length ? initialUniqueCategories : uniqueServiceCategories}
                        toggle={toggleServiceCategory}
                        selected={selectedServiceCategories}
                    />
                </motion.div>



            {/* 4. MAIN INTERACTION AREA (SIDEBAR + TABLE) */}
            <motion.div 
    variants={riseSpring}
className="space-y-8 px-4 max-w-7xl mx-auto mt-6 flex-grow pb-32 lg:pb-24">

                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    {/* SIDEBAR */}
                    <motion.div 
                        variants={unrollLeft}
                        className="sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-4 lg:pr-0 -mr-4 lg:mr-0 scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-transparent"
                    >
                        <MaterialFilters
                            categories={categories}
                            selectedAttributes={selectedAttributes}
                            selectedServiceCategories={selectedServiceCategories}
                            toggleAttribute={toggleAttribute}
                            toggleDropdown={toggleDropdown}
                            openDropdowns={openDropdowns}
                            clearFilters={clearFilters}
                        />
                    </motion.div>

                    {/* COMPARISON ENGINE */}
<main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredShops.map((shop) => {
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
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 border border-stone-100 hover:border-orchid-200 hover:-translate-y-1"
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
                    <div className="flex items-center gap-3 mb-3">
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
                        <h3 className="text-xl font-bold text-stone-900 truncate group-hover:text-orchid-600 transition-colors">
                            {shop.shop_name}
                        </h3>
                    </div>
                    
    <div className="mb-4">
    <div className="flex items-center gap-1.5 mt-1 mb-2">
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
{mapUrl ? (
    <a 
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-stone-600 font-medium truncate hover:text-emerald-700 hover:underline cursor-pointer"
        onClick={(e) => e.stopPropagation()}
        title={shop.google_maps_link ? "Open in Google Street View" : "View on Google Maps"}
    >
        {shop.user?.profile?.barangay ? `${shop.user.profile.street ? shop.user.profile.street + ', ' : ''}${shop.user.profile.barangay}` : 'View on Map'}
    </a>
) : (
    <span className="text-sm text-stone-400 font-medium truncate">
        Location not available
    </span>
)}
    </div>
</div>
                    <div className="flex flex-wrap gap-2">
                        {servicesWithoutImages.length > 0 ? (
                            servicesWithoutImages.map(ms => (
                                <div key={ms.id} className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {ms.service_category?.name} - {ms.service_name}: ₱{ms.price}
                                </div>
                            ))
                        ) : (
                            matchingServices.length === 0 && (
                                <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                                    View Services
                                </div>
                            )
                        )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-stone-100 p-4 sm:p-6 flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(shop);
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                            selectedForCompare.find(s => s.id === shop.id)
                                ? 'bg-orchid-50 border-orchid-200 text-orchid-700 shadow-inner'
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                        ⚖️ {selectedForCompare.find(s => s.id === shop.id) ? 'Added' : 'Compare'}
                    </button>

                    <button
                        onClick={() => handleViewProfile(shop.id)}
                        className="flex-1 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                    >
                        Profile
                        <FiArrowRight className="w-4 h-4" />
                    </button>
                </div>
                </motion.div>
              );
            })}
          </main>
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
            {selectedForCompare.length > 0 && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 border-t p-4"
                >
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <span>{selectedForCompare.length} selected</span>

                        <button
                            disabled={selectedForCompare.length < 2}
                            onClick={() => setShowCompareModal(true)}
                            className="px-6 py-2 bg-black text-white rounded"
                        >
                            Compare
                        </button>
                    </div>
                </motion.div>
            )}
{showCompareModal && (
    <div className="fixed inset-0 z-[70] isolate flex items-start justify-center bg-stone-900/60 backdrop-blur-sm p-4 sm:p-6 sm:pt-12">
        <div className="bg-white w-[95vw] max-w-7xl min-w-[320px] mx-auto max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
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

