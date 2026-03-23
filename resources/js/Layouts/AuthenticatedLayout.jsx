import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import "maplibre-gl/dist/maplibre-gl.css";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex relative z-0">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-2xl border-r border-white/20 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}>
                <div className="flex flex-col h-full">
                    {/* Logo and close */}
                    <div className={`p-6 border-b border-white/20 flex items-center justify-between lg:border-none ${user.role === 'store_admin' ? 'bg-emerald-50/50 shadow-emerald-200/50' : user.role === 'super_admin' ? 'bg-blue-50/50 shadow-blue-200/50' : 'bg-orchid-purple/10 shadow-orchid-purple-200/50'}`}>
                        <Link href="/" className="flex shrink-0 items-center">
                            <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 overflow-y-auto space-y-2">
                        {user.role === 'super_admin' && (
                            <>
                                <NavLink href={route('super.shops.index')} active={route().current('super.shops.index')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m-1-4-4 4 4 4zm0 0l4-4-4-4" />
                                    </svg>
                                    Tailoring Shops
                                </NavLink>
                                <NavLink href={route('super.users.index')} active={route().current('super.users.index')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    User Management
                                </NavLink>
                            </>
                        )}
                        {user.role === 'store_admin' && (
                            <>
                                <NavLink href={route('store.dashboard')} active={route().current('store.dashboard')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2m-3 5h6m-6 4h6" />
                                    </svg>
                                    Dashboard
                                </NavLink>
                                <NavLink href={route('store.inventory')} active={route().current('store.inventory')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0h8v4h-8v12H4V11H0V7h8V1h8v6h8z" />
                                    </svg>
                                    Inventory
                                </NavLink>
                                <NavLink href={route('store.orders')} active={route().current('store.orders')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2m-3 5h6m-6 4h6m-8 0h8m-8 0v1m8 0v1" />
                                    </svg>
                                    Orders
                                </NavLink>
                            </>
                        )}
                        {user.role !== 'super_admin' && user.role !== 'store_admin' && (
                            <>
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </NavLink>
                                <NavLink href={route('customer.orders')} active={route().current('customer.orders')} className="group flex items-center p-3 rounded-xl text-gray-800 font-medium hover:bg-gradient-to-r hover:from-orchid-purple/10 hover:to-orchid-blue/10 hover:border-r-4 hover:border-orchid-blue transition-all duration-300 [&.active]:bg-orchid-blue/20 [&.active]:border-r-4 [&.active]:border-orchid-blue [&.active]:font-black [&.active]:text-orchid-blue shadow-sm">
                                    <svg className="w-6 h-6 mr-3 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2m-3 5h6m-6 4h6" />
                                    </svg>
                                    My Orders
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Hamburger toggle for mobile */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-6 left-4 z-50 p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-lg hover:bg-white lg:hidden transition-all duration-300"
            >
                <svg className="h-6 w-6 text-gray-800" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path className={!sidebarOpen ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    <path className={sidebarOpen ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Main content */}
            <main className="flex-1 transition-all lg:ml-64 p-8 lg:p-12 w-full lg:w-auto pt-24 lg:pt-8">
                {header && (
                    <header className="bg-white/70 backdrop-blur-md shadow-lg rounded-2xl p-6 mb-8 border border-white/50">
                        <div className="max-w-4xl mx-auto">
                            {header}
                        </div>
                    </header>
                )}
                {children}
            </main>

            {/* Role-based glow */}
            <div className={`fixed top-0 left-0 w-64 h-1 shadow-lg lg:block hidden transition-all duration-300 ${
                user.role === 'store_admin' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/50' :
                user.role === 'super_admin' ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/50' :
                'bg-gradient-to-r from-orchid-purple to-orchid-blue shadow-orchid-purple/50'
            }`} />

            {/* Bottom dock for mobile */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white/90 backdrop-blur-2xl border-t border-white/20 shadow-2xl">
                <div className="max-w-md mx-auto px-4 py-2 flex justify-around">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors flex flex-col items-center gap-1 text-sm font-medium">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2zM21 4H3c-.98 0-2 .84-2 1.92L5.55 9.94A2 2 0 008 11.45l5 4.83a2 2 0 002 0l5-4.83a2 2 0 002.45-1.51L21 5.92A1 1 0 0021 4z"/>
                                </svg>
                                Profile
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content className="mt-2">
                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
}

