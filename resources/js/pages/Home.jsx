import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import ViewProfile from '@/components/ViewProfile';

export default function Home() {
    const [user, setUser] = useState(null);
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
    
    const [showModal, setShowModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const loadCategories = useCallback(() => {
        return axios.get('/api/categories').then((res) => {
            setCategories(res.data.data || []);
            setServices(res.data.services || []);
            // console.log("Services:", services);
            // console.log("SHOP DATA:", shop);
// console.log("Categories:", services.map(s => s.service_category?.name));
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
        const categories = new Set();
        services.forEach(service => {
            const catName= service.service_category?.name;
            if (catName) categories.add(catName);
        });
        return Array.from(categories);
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
        <div className="space-y-8">
            <div>
                <h1 className="text-6xl font-semibold text-stone-800 text-center">Tailoring Shops Comparison Tool</h1>
                <div className="flex justify-end gap-3">
                    <Link href="/login" className="px-6 py-4 text-xl font-medium text-stone-700 hover:text-stone-900">Log in</Link>
                    <Link href="/register" className="px-6 py-4 text-xl font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700">Sign up</Link>
                </div>
                <p className="mt-1 text-stone-600 text-center">Filter by needs, then compare prices side-by-side.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                <aside className="rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
                    <h2 className="mb-3 font-medium text-stone-800">1. Filter list</h2>
                    {(selectedAttributes.length > 0 || selectedServiceCategories.length > 0) && (
                        <button type="button" onClick={clearFilters} className="mb-3 text-xl text-amber-600 hover:underline">Clear</button>
                    )}
                    
                    {uniqueServiceCategories.length > 0 && (
                        <div className="mb-4">
                            <div className="text-xl font-medium text-stone-700">Services</div>
                            <ul className="mt-1 space-y-1">
                                {uniqueServiceCategories.map((category) => (
                                    <li key={category}>
                                        <label className="flex cursor-pointer items-center gap-2 text-base">
                                            <input type="checkbox" checked={selectedServiceCategories.includes(category)} onChange={() => toggleServiceCategory(category)} className="rounded border-stone-300" />
                                            {category}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {categories.map((cat) => (
                            <div key={cat.id}>
                                <div className="text-xl font-medium text-stone-700">{cat.name}</div>
                                <ul className="mt-1 space-y-1">
                                    {(cat.attribute_types || []).map((attr) => (
                                        <li key={attr.id}>
                                            <label className="flex cursor-pointer items-center gap-2 text-base">
                                                <input type="checkbox" checked={selectedAttributes.includes(attr.id)} onChange={() => toggleAttribute(attr.id)} className="rounded border-stone-300" />
                                                {attr.name}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="min-w-0 space-y-6">
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
                        <h2 className="mb-3 font-medium text-stone-800">2. Select shops to compare</h2>
                        <div className="mb-3">
                            <input type="text" placeholder="Search shop name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded border border-stone-300 px-3 py-2 text-xl" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xl text-stone-600">Shop 1</label>
                                <select value={shop1Id} onChange={(e) => setShop1Id(e.target.value)} className="w-full rounded border border-stone-300 px-6 py-4 text-xl">
                                    <option value="">— Select first shop —</option>
                                    {shops.map((s) => (
                                        <option key={s.id} value={s.id} disabled={String(s.id) === String(shop2Id)}>{s.shop_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xl text-stone-600">Shop 2</label>
                                <select value={shop2Id} onChange={(e) => setShop2Id(e.target.value)} className="w-full rounded border border-stone-300 px-6 py-4 text-xl">
                                    <option value="">— Select second shop —</option>
                                    {shops.map((s) => (
                                        <option key={s.id} value={s.id} disabled={String(s.id) === String(shop1Id)}>{s.shop_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                        {compareLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                            </div>
                        ) : compareShops.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-sm">
                                    <thead>
                                        <tr className="border-b border-stone-200 bg-stone-50">
                                            <th className="px-6 py-4 text-left font-medium text-stone-700">Feature</th>
                                            {compareShops.map((shop) => (
                                                <th key={shop.id} className="px-4 py-3 text-left font-medium text-stone-700">
                                                    <div>{shop.shop_name}</div>
                                                    <div className="text-xs font-normal text-stone-500">{shop.contact_number || 'No phone'}</div>
                                                    <button onClick={() => handleViewProfile(shop.id)} className="text-xs text-amber-600 hover:underline">View profile</button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-stone-100">
                                            <td className="px-8 py-4 font-medium text-stone-600">Location</td>
                                            {compareShops.map((shop) => (
                                                <td key={shop.id} className="px-4 py-2 text-stone-700">{shop.address || '—'}</td>
                                            ))}
                                        </tr>
                                        {uniqueServiceCategories.length > 0 && (
                                            <React.Fragment>
                                                <tr className="border-b border-stone-100">
                                                    <td colSpan={1 + compareShops.length} className="px-4 py-2 font-medium text-stone-700 bg-stone-50">Services</td>
                                                </tr>
                                                {uniqueServiceCategories.map((category) => (
                                                    <tr key={category} className="border-b border-stone-100">
                                                        <td className="px-6 py-4 pl-6 text-stone-600">{category}</td>
                                                        {compareShops.map((shop) => {
                                                            const shopServices = (shop.services || []).filter((s) => s.service_category?.name === category);
                                                            return (
                                                                <td key={shop.id} className="px-6 py-4 text-stone-700">
                                                                    {shopServices.length > 0 ? (
                                                                    <ul className="space-y-1">
                                                                        {shopServices.map((s, idx) => (
                                                                            <li key={idx} className="border-b border-stone-50 last:border-0 pb-1">
                                                                                <div className="font-medium text-xs">{s.service_description || 'Standard Service'}</div>
                                                                                <div className="text-amber-700">₱{Number(s.price ?? 0).toFixed(2)}</div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : '—'}
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
                                                    <td colSpan={1 + compareShops.length} className="px-6 py-4 font-medium text-stone-700 bg-stone-50">{cat.name}</td>
                                                </tr>
                                                {(cat.attribute_types || []).map((attr) => (
                                                    <tr key={attr.id} className="border-b border-stone-100">
                                                        <td className="px-4 py-2 pl-4 text-stone-600">{attr.name}</td>
                                                        {compareShops.map((shop) => {
                                                            const matchedItems = (shop.attributes || []).filter((a) => a.id === attr.id && a.pivot);
                                                            
                                                            return (
                                                                <td key={shop.id} className="px-6 py-4 text-stone-700">
                                                                    {matchedItems.length > 0 ? (
                                                                        <ul className="space-y-2">
                                                                        {matchedItems.map((item, idx) => (
                                                                            <li key={idx} className="border-b border-stone-50 last:border-0 pb-1">
                                                                                <div className="text-stone-800 font-medium">{item.pivot?.item_name || 'Generic'}</div>
                                                                                <div className="text-xs text-stone-500">
                                                                                    ₱{Number(item.pivot?.price ?? 0).toFixed(2)} {item.pivot?.unit || ''}
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : '—'}
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
                            <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500">
                                <span className="text-2xl">⚖️</span>
                                <p className="mt-2 font-medium">Ready to compare</p>
                                <p className="text-sm">Select a shop from the dropdowns above to see its details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                modalLoading ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                        </div>
                    </div>
                ) : (
                    <ViewProfile shop={selectedShop} onClose={() => setShowModal(false)} onPlaceOrder={handlePlaceOrder} />
                )
            )}
        </div>
    );
}
