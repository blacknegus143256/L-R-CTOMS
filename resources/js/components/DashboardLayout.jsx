import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const nav = [
    { to: 'services', label: 'Services' },
    { to: 'customers', label: 'Customers' },
    { to: 'orders', label: 'Orders' },
];

export default function DashboardLayout() {
    const { user, shops, logout } = useAuth();
    const navigate = useNavigate();
    const { shopId: paramShopId } = useParams();
    const [shopId, setShopId] = useState(() => {
        const first = shops[0]?.id;
        if (first) return String(first);
        return '';
    });
    const currentShop = shops.find((s) => String(s.id) === shopId);

    useEffect(() => {
        if (paramShopId && shops.some((s) => String(s.id) === paramShopId)) {
            setShopId(paramShopId);
        } else if (shops.length && !shopId) {
            setShopId(String(shops[0].id));
        }
    }, [paramShopId, shops, shopId]);

    const onShopChange = (e) => {
        const id = e.target.value;
        setShopId(id);
        if (id) navigate(`/dashboard/shop/${id}/services`, { replace: true });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    const base = '/dashboard';
    const shopPrefix = shopId ? `${base}/shop/${shopId}` : base;

    return (
        <div className="flex min-h-screen bg-stone-100">
            <aside className="flex w-56 flex-col border-r border-stone-200 bg-white">
                <div className="flex h-14 items-center border-b border-stone-200 px-4">
                    <Link to="/" className="font-semibold text-stone-800">CTOMS</Link>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    {shops.length > 1 && (
                        <div className="mb-4">
                            <label className="block text-xs font-medium uppercase text-stone-400">Shop</label>
                            <select
                                value={shopId}
                                onChange={onShopChange}
                                className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                            >
                                {shops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.shop_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {shops.length === 1 && currentShop && (
                        <p className="mb-3 truncate text-sm font-medium text-stone-700">{currentShop.shop_name}</p>
                    )}
                    <nav className="space-y-0.5">
                        {nav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={shopId ? `${shopPrefix}/${item.to}` : base}
                                end={false}
                                className={({ isActive }) =>
                                    'block rounded-lg px-3 py-2 text-sm font-medium ' +
                                    (isActive ? 'bg-amber-50 text-amber-800' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900')
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="border-t border-stone-200 p-3">
                    <p className="truncate text-xs text-stone-500">{user?.email}</p>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 text-sm font-medium text-stone-600 hover:text-stone-800"
                    >
                        Sign out
                    </button>
                </div>
            </aside>
            <div className="flex-1 overflow-auto">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6">
                    <h1 className="text-lg font-semibold text-stone-800">Shop dashboard</h1>
                    <Link to="/" className="text-sm text-stone-500 hover:text-stone-700">← Back to site</Link>
                </header>
                <main className="p-6">
                    {!currentShop && shops.length === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
                            <p className="font-medium">No shop assigned</p>
                            <p className="mt-1 text-sm">Your account is not linked to any shop yet. Contact an administrator.</p>
                        </div>
                    ) : currentShop ? (
                        <Outlet context={{ shop: currentShop, shopId: currentShop.id }} />
                    ) : (
                        <div className="rounded-xl border border-stone-200 bg-white p-6">
                            <p className="text-stone-500">Select a shop above to manage services, customers, and orders.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
