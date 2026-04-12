import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ViewProfile from '@/Components/ViewProfile';
import "maplibre-gl/dist/maplibre-gl.css";
import LocationMapModal from "@/Components/LocationMapModal";
import HeroSearch from '@/Components/Home/HeroSearch';

import ShopCarousel from '@/Components/Home/ShopCarousel';
import ServiceCategoryPills from '@/Components/Home/ServiceCategoryPills';
import MaterialFilters from '@/Components/Home/MaterialFilters';
import ShopActionCard from '@/Components/Home/ShopActionCard';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ComparisonTable from '@/Components/Home/ComparisonTable'; // Preserved for future
import ShopCoverCarousel from '@/Components/Home/ShopCoverCarousel';

import Footer from '@/Components/Home/Footer';




export default function Home({ auth, categories: initialCategories, services: initialServices, shops: initialShops, uniqueServiceCategories: initialUniqueCategories }) {

    const currentUser = auth.user;

    const categories = initialCategories || [];
    const services = initialServices || [];
    const shops = initialShops || [];
    const [compareShops, setCompareShops] = useState([]);
    const [shop1Id, setShop1Id] = useState('');
    const [shop2Id, setShop2Id] = useState('');
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedServiceCategories, setSelectedServiceCategories] = useState([]);
    const [search, setSearch] = useState('');
const [compareLoading, setCompareLoading] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [modalLoading] = useState(false);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [highlightCarousel, setHighlightCarousel] = useState(false);
    

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

    const loadCompare = useCallback(() => {
        setCompareLoading(true);
        if (shop1Id && !shop2Id) {
            const shop1 = filteredShops.find(s => s.id == shop1Id);
            setCompareShops([shop1].filter(Boolean));
        } else if (!shop1Id && shop2Id) {
            const shop2 = filteredShops.find(s => s.id == shop2Id);
            setCompareShops([shop2].filter(Boolean));
        } else if (shop1Id && shop2Id && shop1Id !== shop2Id) {
            const shop1 = filteredShops.find(s => s.id == shop1Id);
            const shop2 = filteredShops.find(s => s.id == shop2Id);
            setCompareShops([shop1, shop2].filter(Boolean));
        } else {
            setCompareShops([]);
        }
        setCompareLoading(false);
    }, [shop1Id, shop2Id, filteredShops]);

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

    useEffect(() => {
        loadCompare();
    }, [shop1Id, shop2Id, filteredShops]);

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

    
    const onGhostClick = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setHighlightCarousel(true);
        setTimeout(() => setHighlightCarousel(false), 2000);
    }, []);

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

    const handleCarouselSelectShop = useCallback((shopId) => {
        const idStr = String(shopId);
        if (!shop1Id) {
            setShop1Id(idStr);
            return;
        }
        if (!shop2Id && idStr !== String(shop1Id)) {
            setShop2Id(idStr);
            return;
        }
        if (idStr !== String(shop1Id)) {
            setShop2Id(idStr);
        }
    }, [shop1Id, shop2Id]);

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
            <motion.div variants={slideFromRight}
onMouseEnter={() => setIsCarouselPaused(true)}   // Freeze the sweep/move
    onMouseLeave={() => setIsCarouselPaused(false)}  // Resume from current spot
    >
                <ShopCarousel
                    shops={filteredShops}
                    isPaused={isCarouselPaused}
                    setIsPaused={setIsCarouselPaused}
                    getShopInitials={getShopInitials}
                    selectedIds={[String(shop1Id), String(shop2Id)].filter(Boolean)}
                    onSelectShop={handleCarouselSelectShop}
                    highlightCarousel={highlightCarousel}
                    activeCategory={selectedServiceCategories[0] || null}
                />
            </motion.div>

            {/* 3. SERVICE PILLS - Prominent Primary Filter */}
            <motion.div variants={fadeUp} className="px-4 max-w-7xl mx-auto mb-8">
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orchid-purple via-orchid-blue to-orchid-pink bg-clip-text text-transparent mb-8 px-2 border-l-8 border-orchid-blue pl-6 tracking-tight">
                    Services:
                
                <ServiceCategoryPills
                    categories={initialUniqueCategories?.length ? initialUniqueCategories : uniqueServiceCategories}
                    selected={selectedServiceCategories}
                    toggle={toggleServiceCategory}
                />
                </h2>
            </motion.div>

            {/* 4. MAIN INTERACTION AREA (SIDEBAR + TABLE) */}
            <motion.div variants={riseSpring} className="space-y-8 px-4 max-w-7xl mx-auto mt-6 flex-grow">
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
              const activeCategory = selectedServiceCategories[0];
              const matchingService = activeCategory 
                ? shop.services.find(s => s.service_category?.name === activeCategory) 
                : null;
              const priceDisplay = matchingService 
                ? `${activeCategory}: ₱${matchingService.price}` 
                : 'View Services';
              
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
                      getShopInitials={getShopInitials} 
                  />
                  <div className="p-6 pt-5">
                    <h3 className="text-xl font-bold text-stone-900 truncate mb-2 group-hover:text-orchid-600 transition-colors">

                      {shop.shop_name}
                    </h3>
                    
    <div className="mb-4">
    <div className="flex items-center gap-1.5 mt-1 mb-2">
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        {shop.user?.profile?.latitude && shop.user?.profile?.longitude ? (
            <a 
                href={`https://www.google.com/maps?q=${shop.user?.profile?.latitude},${shop.user?.profile?.longitude}`}
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
        )}
    </div>
</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      matchingService 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {priceDisplay}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-stone-100 p-6">
                    <button
                      onClick={() => handleViewProfile(shop.id)}
                      className="w-full bg-gradient-to-r from-orchid-blue to-orchid-purple hover:from-orchid-blue/90 hover:to-orchid-purple/90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02]"
                    >
                      View Profile
                      <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
                    <ViewProfile shop={selectedShop} onClose={() => setShowModal(false)} onPlaceOrder={handlePlaceOrder} />
                </div>
            )}
            
            {locationModalOpen && selectedLocation && (
                <LocationMapModal location={selectedLocation} onClose={() => setLocationModalOpen(false)} />
            )}

            <Footer />
        </motion.div>
    );
}

