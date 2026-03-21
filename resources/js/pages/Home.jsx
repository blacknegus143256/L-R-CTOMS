import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import ViewProfile from '@/Components/ViewProfile';
import "maplibre-gl/dist/maplibre-gl.css";
import LocationMapModal from "@/Components/LocationMapModal";

export default function Home(header, children) {
    const [user, setUser] = useState(null);
    
    const currentUser = usePage().props.auth.user;

    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [shops, setShops] = useState([]);
    const [compareShops, setCompareShops] = useState([]);
    const [shop1Id, setShop1Id] = useState('');
    const [shop2Id, setShop2Id] = useState('');
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedServiceCategories, setSelectedServiceCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [compareLoading, setCompareLoading] = useState(false);
    const [error, setError] = useState(null);
    const { auth } = usePage().props;
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    

    const [openDropdowns, setOpenDropdowns] = useState({});

    const loadCategories = useCallback(() => {
        return axios.get('/api/categories').then((res) => {
            setCategories(res.data.data || []);
            setServices(res.data.services || []);
        });
    }, []);

    const loadServices = useCallback(() => {
        return axios.get('/api/services').then((res) => setServices(res.data.data || []));
    }, []);

    const loadShops = useCallback((searchTerm = '', attributeIds = [], serviceCategories = []) => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        attributeIds.forEach((id) => params.append('attributes[]', id));
        if (serviceCategories.length > 0) {
            serviceCategories.forEach((cat) => params.append('service_categories[]', cat));
        }
        return axios.get('/api/shops?' + params.toString()).then((res) => setShops(res.data.data || []));
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([loadCategories(), loadServices(), loadShops()])
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [loadCategories, loadServices, loadShops]);

    useEffect(() => {
        if (!loading) loadShops(search, selectedAttributes, selectedServiceCategories);
    }, [search, selectedAttributes, selectedServiceCategories, loading, loadShops]);

    const uniqueServiceCategories = useMemo(() => {
        const cats = new Set();
        services.forEach(service => {
            const catName = service.service_category?.name;
            if (catName) cats.add(catName);
        });
        return Array.from(cats);
    }, [services]);

    const filteredServiceCategories = useMemo(() => {
        if (compareShops.length === 0) return [];
        return uniqueServiceCategories.filter(category => 
            compareShops.some(shop => 
                (shop.services || []).some(s => s.service_category?.name === category)
            )
        );
    }, [uniqueServiceCategories, compareShops]);

    const loadCompare = useCallback(() => {
        if (shop1Id && !shop2Id) {
            setCompareLoading(true);
            axios.get(`/api/shops/${shop1Id}`)
                .then((res) => setCompareShops([res.data.data].filter(Boolean)))
                .catch(() => setCompareShops([]))
                .finally(() => setCompareLoading(false));
            return;
        }
        if (!shop1Id && shop2Id) {
            setCompareLoading(true);
            axios.get(`/api/shops/${shop2Id}`)
                .then((res) => setCompareShops([res.data.data].filter(Boolean)))
                .catch(() => setCompareShops([]))
                .finally(() => setCompareLoading(false));
            return;
        }
        if (!shop1Id || !shop2Id || shop1Id === shop2Id) {
            setCompareShops([]);
            return;
        }
        setCompareLoading(true);
        axios.get(`/api/shops/compare?shop1=${shop1Id}&shop2=${shop2Id}`)
            .then((res) => setCompareShops(res.data.data || []))
            .catch(() => setCompareShops([]))
            .finally(() => setCompareLoading(false));
    }, [shop1Id, shop2Id]);

    useEffect(() => {
        loadCompare();
    }, [shop1Id, shop2Id, loadCompare]);

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
        setModalLoading(true);
        setSelectedShop(null);
        setShowModal(true);
        axios.get(`/api/shops/${shopId}`)
            .then((res) => setSelectedShop(res.data.data))
            .catch(() => setShowModal(false))
            .finally(() => setModalLoading(false));
    };

    const handlePlaceOrder = () => {
        axios.get('/api/user')
            .then((res) => {
                setUser(res.data.user);
                alert('Proceeding with order...');
            })
            .catch(() => {
                window.location.href = '/login';
            });
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

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
        );
    }

    if (error) {
        return <div className="rounded-lg bg-red-50 p-8 text-red-700">Failed to load: {error}</div>;
    }

    return (
        <div>
            {/* Hero Section */}
            <section 
                className="relative bg-cover bg-center bg-no-repeat min-h-[60vh] md:min-h-[70vh] flex items-center justify-center px-4"
                style={{ backgroundImage: 'url(/images/Tailorcut.jpg)' }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-4xl">
                    <div className="text-center text-white mb-12">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl mb-4">
                            Tailoring Shops
                        </h1>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight drop-shadow-xl">
                            Comparison Tool
                        </h1>
                        <p className="text-xl md:text-2xl text-amber-100/90 max-w-2xl mx-auto drop-shadow-lg">
                            Filter by needs, then compare prices side-by-side
                        </p>
                    </div>
                    
                    {/* Glassmorphism Search */}
                    <div className="relative mx-auto w-full max-w-2xl">
                        <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-1">
                            <input 
                                type="text" 
                                placeholder="Search shop name..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/80 backdrop-blur-sm border-0 rounded-3xl px-12 py-6 text-xl placeholder-stone-500 font-medium focus:outline-none focus:ring-4 focus:ring-white/50 transition-all duration-300 shadow-inner"
                            />
                            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Service Filters Dock */}
                    {uniqueServiceCategories.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-nowrap overflow-x-auto gap-3 pb-4 scrollbar-hide bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/50 shadow-2xl max-w-5xl mx-auto">
                                <span className="text-sm font-bold text-stone-700 uppercase self-center shrink-0 whitespace-nowrap">Services:</span>
                                {uniqueServiceCategories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleServiceCategory(category)}
                                        className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                                            selectedServiceCategories.includes(category)
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/50'
                                                : 'bg-white/70 text-stone-700 border border-stone-200/50 hover:bg-white hover:border-stone-300/50'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="space-y-8 px-4 max-w-7xl mx-auto">
                <div className="flex justify-end gap-3 items-center mt-6">
                    {auth.user ? (
                        <div className="flex gap-6 items-center">
                            <Link href="/dashboard" className="text-stone-600 hover:text-amber-700 font-medium">Dashboard</Link>
                            {currentUser.role === 'customer' && (
                            <Link href="/my-orders" className="text-stone-600 hover:text-amber-700 font-medium">My Orders</Link>
                            )}
                <div className="flex justify-end gap-3 items-center mt-4">
                    {auth.user ? (
                        <div className="flex gap-6 items-center">
                            <Link href="/dashboard" className="text-stone-600 hover:text-amber-700 font-medium">Dashboard</Link>
                            {currentUser.role === 'customer' && (
                            <Link href="/my-orders" className="text-stone-600 hover:text-amber-700 font-medium">My Orders</Link>
                            )}
                            <Link href="/profile" className="px-4 py-2 bg-stone-100 text-stone-700 rounded-full hover:bg-stone-200 transition">Hi, {auth.user.name}</Link>
                            <Link href="/logout" method="post" as="button" className="text-red-600 text-sm hover:underline">Log out</Link>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="px-6 py-3 text-lg font-medium text-stone-700 hover:text-stone-900">Log in</Link>
                            <Link href="/register" className="px-6 py-3 text-lg font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700">Sign up</Link>
                        </>
                    )}
                </div>
                <p className="mt-2 text-stone-600 text-center">Filter by needs, then compare prices side-by-side.</p>
            </div>

            {uniqueServiceCategories.length > 0 && (
                <div className="sticky top-0 z-30 bg-white py-3 border-b border-stone-200 shadow-sm">
                    <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-hide">
                        <span className="text-sm font-bold text-stone-500 uppercase self-center shrink-0">Services:</span>
                        {uniqueServiceCategories.map((category) => (
                            <button
                                key={category}
                                onClick={() => toggleServiceCategory(category)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedServiceCategories.includes(category)
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-3">
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-stone-800">Materials Filter</h2>
                            {(selectedAttributes.length > 0 || selectedServiceCategories.length > 0) && (
                                <button type="button" onClick={clearFilters} className="text-sm text-amber-600 hover:underline font-medium">Clear All</button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {categories.map((cat) => {
                                const selectedCount = (cat.attribute_types || []).filter(a => selectedAttributes.includes(a.id)).length;
                                const isOpen = openDropdowns[cat.id];
                                return (
                                    <div key={cat.id} className="border border-stone-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleDropdown(cat.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 bg-stone-50 hover:bg-stone-100 transition-colors"
                                        >
                                            <span className="font-medium text-stone-700 text-sm">{cat.name} {selectedCount > 0 && `(${selectedCount})`}</span>
                                            <svg className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {isOpen && (
                                            <div className="p-2 bg-white max-h-48 overflow-y-auto">
                                                {(cat.attribute_types || []).map((attr) => (
                                                    <label key={attr.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-stone-50 rounded cursor-pointer">
                                                        <input type="checkbox" checked={selectedAttributes.includes(attr.id)} onChange={() => toggleAttribute(attr.id)} className="rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
                                                        <span className="text-sm text-stone-700">{attr.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 space-y-4">
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
                        <h2 className="mb-3 font-semibold text-stone-800">Select shops to compare</h2>
                        <div className="relative mb-4">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search shop name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" />
                        </div>
                        <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
                            {/* Shop 1 Card */}
                            <div 
                                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-4 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px] text-center backdrop-blur-sm ${
                                    shop1Id 
                                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-2xl hover:shadow-amber-500/25' 
                                        : 'border-dashed border-stone-300 hover:border-amber-300 hover:bg-stone-50'
                                }`}
                                onClick={() => !shop1Id && document.getElementById('shop1-select')?.showPicker()}
                            >
                                {shop1Id ? (
                                    <>
                                        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                            {(() => {
                                                const shop = shops.find(s => s.id == shop1Id);
                                                if (shop) {
                                                    const initials = shop.shop_name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
                                                    return initials;
                                                }
                                                return 'JS';
                                            })()}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-xl text-stone-800">
                                                {shops.find(s => s.id == shop1Id)?.shop_name || 'Shop 1'}
                                            </h3>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShop1Id(''); }}
                                                className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-sm transition-all duration-200"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                                            <svg className="w-8 h-8 text-stone-500 group-hover:text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-xl text-stone-600 mb-2">Select Shop 1</h3>
                                        <p className="text-sm text-stone-500">Click to choose</p>
                                        <select 
                                            id="shop1-select"
                                            value={shop1Id} 
                                            onChange={(e) => setShop1Id(e.target.value)}
                                            className="absolute opacity-0 h-0 w-0"
                                        >
                                            <option value="">— Select first shop —</option>
                                            {shops.map((s) => (
                                                <option key={s.id} value={s.id} disabled={String(s.id) === String(shop2Id)}>{s.shop_name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>

                            {/* Shop 2 Card */}
                            <div 
                                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-4 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px] text-center backdrop-blur-sm ${
                                    shop2Id 
                                        ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200 shadow-2xl hover:shadow-emerald-500/25' 
                                        : 'border-dashed border-stone-300 hover:border-emerald-300 hover:bg-stone-50'
                                }`}
                                onClick={() => !shop2Id && document.getElementById('shop2-select')?.showPicker()}
                            >
                                {shop2Id ? (
                                    <>
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                            {(() => {
                                                const shop = shops.find(s => s.id == shop2Id);
                                                if (shop) {
                                                    const initials = shop.shop_name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
                                                    return initials;
                                                }
                                                return 'JS';
                                            })()}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-xl text-stone-800">
                                                {shops.find(s => s.id == shop2Id)?.shop_name || 'Shop 2'}
                                            </h3>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShop2Id(''); }}
                                                className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-sm transition-all duration-200"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                                            <svg className="w-8 h-8 text-stone-500 group-hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-xl text-stone-600 mb-2">Select Shop 2</h3>
                                        <p className="text-sm text-stone-500">Click to choose</p>
                                        <select 
                                            id="shop2-select"
                                            value={shop2Id} 
                                            onChange={(e) => setShop2Id(e.target.value)}
                                            className="absolute opacity-0 h-0 w-0"
                                        >
                                            <option value="">— Select second shop —</option>
                                            {shops.map((s) => (
                                                <option key={s.id} value={s.id} disabled={String(s.id) === String(shop1Id)}>{s.shop_name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {(selectedAttributes.length > 0 || selectedServiceCategories.length > 0) && (
                        <div className="flex flex-wrap gap-2 items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <span className="text-sm font-bold text-stone-500 uppercase">Active Filters:</span>
                            {selectedServiceCategories.map(cat => (
                                <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium">
                                    {cat}
                                    <button onClick={() => toggleServiceCategory(cat)} className="hover:text-red-600 ml-1">×</button>
                                </span>
                            ))}
                            {selectedAttributeNames.map(name => (
                                <span key={name} className="flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-700 rounded-full text-sm font-medium">
                                    {name}
                                    <button onClick={() => {
                                        const attr = categories.flatMap(c => c.attribute_types || []).find(a => a.name === name);
                                        if (attr) toggleAttribute(attr.id);
                                    }} className="hover:text-red-600 ml-1">×</button>
                                </span>
                            ))}
                            <button onClick={clearFilters} className="text-sm text-red-600 font-semibold ml-2 hover:underline">Clear All</button>
                        </div>
                    )}

                    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                        {compareLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                            </div>
                        ) : compareShops.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm [&amp;_tr:nth-child(even)]:bg-stone-50/50 [&amp;_tr:nth-child(even):hover]:bg-stone-100/50 [&amp;_tr:hover]:bg-stone-50/70 transition-all duration-200 min-w-[900px]">
                                    <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-lg border-b-2 border-stone-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-lg text-stone-900 min-w-[180px] sticky left-0 bg-white/95 z-30">Service / Feature</th>
                                            {compareShops.map((shop, shopIndex) => (
                                                <th key={shop.id} className={`px-6 py-4 text-left font-bold text-lg ${shopIndex === 0 ? 'text-amber-700' : 'text-emerald-700'} min-w-[280px]`}>
                                                    <div className="text-xl font-black mb-1 tracking-tight">{shop.shop_name}</div>
                                                    <div className="text-sm font-normal text-stone-600 mb-2">{shop.contact_number || 'No phone'}</div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleViewProfile(shop.id)} className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap">
                                                            View Profile
                                                        </button>
                                                        <button onClick={() => (shopIndex === 0 ? setShop1Id('') : setShop2Id(''))} className="text-xs text-stone-500 hover:text-stone-700">Swap</button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-stone-100">
                                            <td className="px-4 py-3 font-medium text-stone-600">Location</td>
                                            {compareShops.map((shop) => {
                                                const profile = shop.user?.profile;
                                                const lat = profile?.latitude;
                                                const lng = profile?.longitude;
                                                const hasCoords = lat && lng;
                                                const addressParts = [
                                                    profile?.purok ? `Purok ${profile.purok}` : null,
                                                    profile?.street,
                                                    profile?.barangay ? `Brgy. ${profile.barangay}` : null
                                                ].filter(Boolean).join(', ');
                                                return (
                                                    <td key={shop.id} className="px-4 py-3 text-stone-700">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-medium">{addressParts || 'Address not set'}</span>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {hasCoords && (
                                                                    <button onClick={() => {
                                                                        setSelectedLocation({ lat, lng, shopName: shop.shop_name, street: profile?.street, barangay: profile?.barangay });
                                                                        setLocationModalOpen(true);
                                                                    }} className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600 hover:bg-stone-200 transition flex items-center gap-1">📍 Pinpoint</button>
                                                                )}
                                                                {hasCoords && (
                                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 font-medium">🌐 Google Maps</a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        {uniqueServiceCategories.length > 0 && (
                                            <React.Fragment>
                                                <tr className="border-b border-stone-100">
                                                    <td colSpan={1 + compareShops.length} className="px-4 py-2 font-semibold text-stone-700 bg-stone-50">Services</td>
                                                </tr>
                                                {filteredServiceCategories.map((category) => {
                                                    const allServices = compareShops.flatMap(shop => 
                                                        (shop.services || []).filter(s => s.service_category?.name === category)
                                                    );
                                                    
                                                    // Find cheapest price for winner highlighting
                                                    const minPrice = Math.min(...allServices.map(s => Number(s.price || 0)));
                                                    
                                                    return (
                                                        <tr key={category} className="hover:bg-stone-50/50 transition-colors group">
                                                            <td className="px-6 py-4 pl-8 font-semibold text-stone-800 bg-gradient-to-r from-amber-50 to-transparent border-r border-stone-200 sticky left-0 z-10">
                                                                {category}
                                                                <div className="text-xs text-stone-500 font-normal mt-1">Services</div>
                                                            </td>
                                                            {compareShops.map((shop, shopIndex) => {
                                                                const shopServices = (shop.services || []).filter((s) => s.service_category?.name === category);
                                                                return (
                                                                    <td key={shop.id} className={`px-6 py-4 relative ${shopIndex === 0 ? 'border-r-2 border-stone-200' : ''}`}>
                                                                        {shopServices.length > 0 ? (
                                                                            <div className="space-y-3">
                                                                                {shopServices.map((s, idx) => {
                                                                                    const price = Number(s.price ?? 0);
                                                                                    const isWinner = price === minPrice && minPrice > 0;
                                                                                    return (
                                                                                        <div key={idx} className="group/service border border-stone-200 rounded-xl p-4 hover:shadow-md hover:border-amber-300 transition-all backdrop-blur-sm bg-white/80">
                                                                                            <div className="font-bold text-stone-900 text-lg mb-1 truncate">{s.service_name || 'Standard Service'}</div>
                                                                                            <div className="text-sm text-stone-600 mb-3 line-clamp-2">{s.service_description || 'Professional tailoring service'}</div>
                                                                                            <div className={`inline-flex items-center px-3 py-2 rounded-full font-bold text-base transition-all ${
                                                                                                isWinner 
                                                                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 transform hover:scale-105' 
                                                                                                    : 'bg-gradient-to-r from-stone-100 to-stone-200 text-stone-900 shadow-sm hover:shadow-md'
                                                                                            }`}>
                                                                                                ₱{price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                                                                {isWinner && (
                                                                                                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-8 text-stone-400">
                                                                                <svg className="w-12 h-12 mx-auto mb-2 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                                                </svg>
                                                                                <div className="font-medium text-stone-500">Not offered</div>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        )}
                                        {categories.map((cat) => (
                                            <React.Fragment key={cat.id}>
                                                <tr className="border-b border-stone-100">
                                                    <td colSpan={1 + compareShops.length} className="px-4 py-2 font-semibold text-stone-700 bg-stone-50">{cat.name}</td>
                                                </tr>
                                                {(cat.attribute_types || []).map((attr) => (
                                                    <tr key={attr.id} className="border-b border-stone-100">
                                                        <td className="px-4 py-2 pl-4 text-stone-600">{attr.name}</td>
                                                        {compareShops.map((shop) => {
                                                            const matchedItems = (shop.attributes || []).filter((a) => a.id === attr.id && a.pivot);
                                                            return (
                                                                <td key={shop.id} className="px-4 py-3">
                                                                    {matchedItems.length > 0 ? (
                                                                        <ul className="space-y-2">
                                                                            {matchedItems.map((item, idx) => (
                                                                                <li key={idx} className="border-b border-stone-50 last:border-0 pb-1">
                                                                                    <div className="text-stone-800 font-medium">{item.pivot?.item_name || 'Generic'}</div>
                                                                                    <div className="font-bold">₱{Number(item.pivot?.price ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : <span className="text-stone-400">N/A</span>}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
                                <svg className="w-16 h-16 text-stone-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                <p className="text-lg font-medium text-stone-600">Ready to compare</p>
                                <p className="text-sm text-stone-500 mt-1">Select shops from the dropdowns above to see their details side-by-side.</p>
                            </div>
                        )}
                    </div>

                    {shops.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
                            <svg className="w-16 h-16 text-stone-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-lg font-medium text-stone-600">No shops match all selected filters</p>
                            <p className="text-sm text-stone-500 mt-1">Try removing some filters to see more results.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (modalLoading ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                    </div>
                </div>
            ) : (
                <ViewProfile shop={selectedShop} onClose={() => setShowModal(false)} onPlaceOrder={handlePlaceOrder} />
            ))}
            {locationModalOpen && selectedLocation && (
                <LocationMapModal location={selectedLocation} onClose={() => setLocationModalOpen(false)} />
            )}
        </div>
    );
}

