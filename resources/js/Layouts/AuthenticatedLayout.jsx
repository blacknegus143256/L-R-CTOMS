import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FiX, FiUser, FiLogOut, FiMenu, FiHome, FiBox, FiShoppingCart, FiBriefcase, FiLayers } from 'react-icons/fi';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
<div className="h-screen bg-stone-50 flex overflow-hidden relative z-0">
            {/* Sidebar - Slimmer width (w-60) */}
            <aside className={` bg-slate-50 border-stone-200 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}>
                <div className="flex flex-col h-full">
                    {/* Logo Area - Reduced Padding */}
                    <div className={`p-5 border-b border-stone-100 flex items-center justify-between shrink-0 ${user.role === 'store_admin' ? 'bg-emerald-50/30' : user.role === 'super_admin' ? 'bg-blue-50/30' : 'bg-orchid-purple/5'}`}>
                        <Link href="/" className="flex shrink-0 items-center">
                            <ApplicationLogo className="block h-8 w-auto fill-current text-gray-800" />
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                           <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Nav Links - Tightened Spacing */}
<nav className="flex-1 flex-col px-8 py-10 overflow-y-auto space-y-1 custom-scrollbar">
                        {/* Dynamic Links Based on Role */}
                        {user.role === 'super_admin' && (
                            <>
                                <NavLink href={route('super.shops.index')} active={route().current('super.shops.index')}className="text-base px-4 py-3" >
                                    <FiBriefcase className="w-5 h-5 mr-3" />
                                    Tailoring Shops</NavLink>
                                <NavLink href={route('super.users.index')} active={route().current('super.users.index')} icon={FiUser} className="text-base px-4 py-3" >Users</NavLink>
                            </>
                        )}
                        {user.role === 'store_admin' && (
                            <>
                            <div>
                                <NavLink href={route('store.dashboard')} active={route().current('store.dashboard')} className="text-base px-4 py-3">
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Dashboard
                                </NavLink>
                                </div>
                                <div>
                                    <NavLink href={route('store.services')} active={route().current('store.services')} className="text-base px-4 py-3" >
                                        <FiLayers className="w-5 h-5 mr-3" />
                                        Services
                                    </NavLink>
                                </div>
                                <div>
                                <NavLink href={route('store.inventory')} active={route().current('store.inventory')} className="text-base px-4 py-3" >
                                    <FiBox className="w-5 h-5 mr-3" />
                                    Inventory
                                </NavLink>
                                </div>
                                <div>
                                <NavLink href={route('store.orders')} active={route().current('store.orders')} className="text-base px-4 py-3" >
                                    <FiShoppingCart className="w-5 h-5 mr-3" />
                                    Orders
                                </NavLink>
                                </div>
                            </>
                        )}
                        {/* Customer Dashboard Link */}
                        {user.role !== 'super_admin' && user.role !== 'store_admin' && (
                            <>
                            <div>
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} className="text-lg px-4 py-3">
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Dashboard
                                </NavLink>
                            </div>
                            <div>
                               <NavLink href={route('customer.orders')} active={route().current('customer.orders')} className="text-base px-4 py-3">
                                   <FiShoppingCart className="w-5 h-5 mr-3" />
                                   My Orders
                               </NavLink>
                               </div>
                            </>
                        )}
                    </nav>

                    {/* FIXED BOTTOM SECTION: Profile & Logout */}
                    <div className="px-4  shrink-0 flex-col">
                        <Link href={route('profile.edit')} className="w-full flex items-center p-3 rounded-xl text-stone-500 font-medium hover:bg-rose-50 hover:text-blue-600 transition-all duration-200" >
                            <FiUser className="w-5 h-5 mr-3" />
                            Profile
                        </Link>
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button" 
                            className="w-full flex items-center p-3 rounded-xl text-stone-500 font-medium hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
                        >
                            <FiLogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content - Reduced Margin and Padding */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar relative pt-20 lg:pt-6">
{header && (
    <div className="max-w-[100rem] mx-auto mb-6">
        {/* Change h2 to div to prevent nesting errors */}
        <div className="text-xl font-bold text-stone-800 leading-tight">
            {header}
        </div>
    </div>
)}
                <div className="max-w-[100rem] mx-auto">
                    {children}
                </div>
            </main>

            {/* Role-based top glow - thin line */}
            <div className={`fixed top-0 left-0 w-60 h-1 z-[60] lg:block hidden ${
                user.role === 'store_admin' ? 'bg-emerald-500 shadow-[0_1px_10px_rgba(16,185,129,0.5)]' :
                user.role === 'super_admin' ? 'bg-blue-500 shadow-[0_1px_10px_rgba(59,130,246,0.5)]' :
                'bg-orchid-purple shadow-[0_1px_10px_rgba(168,85,247,0.5)]'
            }`} />

            {/* Mobile hamburger */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-lg lg:hidden"
                >
                    <FiMenu className="h-6 w-6 text-gray-800" />
                </button>
            )}

            {/* Mobile overlay */}
{sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    </div>
    );
}

