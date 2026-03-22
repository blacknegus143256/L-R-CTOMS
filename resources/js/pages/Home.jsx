import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ViewProfile from '@/Components/ViewProfile';
import "maplibre-gl/dist/maplibre-gl.css";
import LocationMapModal from "@/Components/LocationMapModal";
import HeroSearch from '@/Components/Home/HeroSearch';
import ShopCarousel from '@/Components/Home/ShopCarousel';
import ServiceCategoryPills from '@/Components/Home/ServiceCategoryPills';
import MaterialFilters from '@/Components/Home/MaterialFilters';
import ShopActionCard from '@/Components/Home/ShopActionCard';
import ComparisonTable from '@/Components/Home/ComparisonTable';
import Footer from '@/Components/Home/Footer';


export default function Home({ auth, categories: initialCategories, services: initialServices, shops: initialShops, uniqueServiceCategories: initialUniqueCategories }) {
    const { router } = usePage();
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

    const handlePlaceOrder = (shop) => {
        if (!auth.user) {
            router.visit('/login');
            return;
        }
        const name = shop?.shop_name ?? 'selected shop';
        alert(`Proceeding with order at ${name} for ${auth.user.name}...`);
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
            <motion.div variants={slideFromRight}>
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

            {/* 3. SERVICE PILLS */}
            <ServiceCategoryPills
                categories={initialUniqueCategories?.length ? initialUniqueCategories : uniqueServiceCategories}
                selected={selectedServiceCategories}
                toggle={toggleServiceCategory}
            />

            {/* 4. MAIN INTERACTION AREA (SIDEBAR + TABLE) */}
            <motion.div variants={riseSpring} className="space-y-8 px-4 max-w-7xl mx-auto mt-6 flex-grow">
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    {/* SIDEBAR */}
                    <motion.div variants={unrollLeft}>
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
                    <main className="min-w-0 space-y-4">
                        <motion.div variants={fadeUp} layout className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
                            <h2 className="mb-3 font-semibold text-stone-800 text-center">Compare Your Selected Units</h2>
                            <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
                                <ShopActionCard
                                    slot={1}
                                    shopId={shop1Id}
                                    otherShopId={shop2Id}
                                    shops={filteredShops}
                                    setShopId={setShop1Id}
                                    imageUrl="/images/Tailorcut.jpg"
                                    accentClass="hover:shadow-orchid-blue/25 border-orchid-blue/20"
                                    emptyHoverClass="hover:border-orchid-blue hover:bg-slate-50"
                                />
                                <ShopActionCard
                                    slot={2}
                                    shopId={shop2Id}
                                    otherShopId={shop1Id}
                                    shops={filteredShops}
                                    setShopId={setShop2Id}
                                    imageUrl="/images/alterations-vs-tailoring.jpg"
                                    accentClass="hover:shadow-orchid-purple/25 border-orchid-purple/20"
                                    emptyHoverClass="hover:border-orchid-purple hover:bg-slate-50"
                                />
                            </div>
                        </motion.div>

                        <ComparisonTable
                            compareLoading={compareLoading}
                            compareShops={compareShops}
                            categories={categories}
                            uniqueServiceCategories={uniqueServiceCategories}
                            onViewProfile={handleViewProfile}
                            onSwapShop={(idx) => (idx === 0 ? setShop1Id('') : setShop2Id(''))}
                            onPlaceOrder={handlePlaceOrder}
                            onOpenLocationMap={(loc) => {
                                setSelectedLocation(loc);
                                setLocationModalOpen(true);
                            }}
                            onGhostClick={onGhostClick}
                        />
                    </main>
                </div>
            </motion.div>

            {/* 5. MODALS AND FOOTER */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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

