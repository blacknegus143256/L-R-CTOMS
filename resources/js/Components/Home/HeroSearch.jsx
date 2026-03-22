import React from 'react';
import { Link } from '@inertiajs/react';

export default function HeroSearch({ auth, currentUser, search, setSearch }) {
    return (
        <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
            <div className="absolute inset-0 electric-mesh-layer" aria-hidden />
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden />

            <nav className="absolute top-6 right-8 z-50">
                {auth?.user ? (
                    <div className="flex gap-4 items-center glass-orchid bg-white/75 rounded-full px-4 py-2 shadow-lg shadow-orchid-blue/20">
                        <Link href="/dashboard" className="text-stone-700 hover:text-orchid-blue font-medium">
                            Dashboard
                        </Link>
                        {currentUser?.role === 'customer' && (
                            <Link href="/my-orders" className="text-stone-700 hover:text-orchid-purple font-medium">
                                My Orders
                            </Link>
                        )}
                        <Link href="/profile" className="text-stone-700 font-medium">
                            Hi, {auth.user.name}
                        </Link>
                        <Link href="/logout" method="post" as="button" className="text-red-600 font-semibold hover:text-red-700">
                            Log out
                        </Link>
                    </div>
                ) : (
                    <div className="flex gap-3 glass-orchid rounded-full px-2 py-1">
                        <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/95 hover:text-white">
                            Log in
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-orchid-blue to-orchid-purple text-white shadow-md hover:opacity-95"
                        >
                            Sign up
                        </Link>
                    </div>
                )}
            </nav>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center text-white mb-12">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-[#4568dc] via-[#7b5cbf] to-[#b06ab3] bg-clip-text text-transparent drop-shadow-2xl mb-4 animate-title-pulse">
                        Tailoring Shops
                    </h1>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-white drop-shadow-xl">
                        Comparison Tool
                    </h1>
                    <p className="text-xl md:text-2xl text-white/85 max-w-2xl mx-auto drop-shadow-lg">
                        Filter by needs, then compare prices side-by-side
                    </p>
                </div>

                <div className="relative mx-auto w-full max-w-2xl shadow-[0_0_30px_rgba(69,104,220,0.35)] rounded-3xl">
                    <div className="relative glass-orchid bg-white/15 rounded-3xl shadow-2xl p-1 ring-1 ring-white/20">
                        <input
                            type="text"
                            placeholder="Search shop name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/85 backdrop-blur-md border-0 rounded-3xl px-12 py-6 text-xl placeholder-stone-500 font-medium focus:outline-none focus:ring-4 focus:ring-[#4568dc]/40 transition-all duration-300 shadow-inner"
                        />
                        <svg
                            className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-orchid-blue/70"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
