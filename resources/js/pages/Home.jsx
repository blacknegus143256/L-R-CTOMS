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
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-semibold text-stone-800 text-center">Tailoring Shops Comparison Tool</h1>
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-600">Shop 1</label>
                                <select value={shop1Id} onChange={(e) => setShop1Id(e.target.value)} className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition">
                                    <option value="">— Select first shop —</option>
                                    {shops.map((s) => (
                                        <option key={s.id} value={s.id} disabled={String(s.id) === String(shop2Id)}>{s.shop_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-600">Shop 2</label>
                                <select value={shop2Id} onChange={(e) => setShop2Id(e.target.value)} className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition">
                                    <option value="">— Select second shop —</option>
                                    {shops.map((s) => (
                                        <option key={s.id} value={s.id} disabled={String(s.id) === String(shop1Id)}>{s.shop_name}</option>
                                    ))}
                                </select>
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
                                <table className="w-full min-w-[700px] text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="border-b border-stone-200 bg-stone-100">
                                            <th className="px-4 py-3 text-left font-semibold text-stone-800 min-w-[150px]">Feature</th>
                                            {compareShops.map((shop) => (
                                                <th key={shop.id} className="px-4 py-3 text-left font-semibold text-stone-800 min-w-[200px]">
                                                    <div className="text-base">{shop.shop_name}</div>
                                                    <div className="text-xs font-normal text-stone-500">{shop.contact_number || 'No phone'}</div>
                                                    <button onClick={() => handleViewProfile(shop.id)} className="text-xs text-amber-600 hover:underline">View profile</button>
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
                                                {uniqueServiceCategories.map((category) => (
                                                    <tr key={category} className="border-b border-stone-100">
                                                        <td className="px-4 py-3 pl-6 text-stone-600">{category}</td>
                                                        {compareShops.map((shop) => {
                                                            const shopServices = (shop.services || []).filter((s) => s.service_category?.name === category);
                                                            return (
                                                                <td key={shop.id} className="px-4 py-3">
                                                                    {shopServices.length > 0 ? (
                                                                        <ul className="space-y-1">
                                                                            {shopServices.map((s, idx) => (
                                                                                <li key={idx} className="border-b border-stone-50 last:border-0 pb-1">
                                                                                    <div className="font-medium text-bold">{s.service_name || 'Standard Service'}</div>
                                                                                    <div className="font-medium text-xs">{s.service_description || 'Standard Service'}</div>
                                                                                    <div className="text-lg font-bold text-amber-700">₱{Number(s.price ?? 0).toFixed(2)}</div>
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
                                                                                    <div className="text-sm font-bold text-amber-700">₱{Number(item.pivot?.price ?? 0).toFixed(2)} {item.pivot?.unit || ''}</div>
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

