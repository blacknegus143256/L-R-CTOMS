import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/Dashboard/StatCard';
import OrderProgress from '@/Components/Dashboard/OrderProgress';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
    'Pending': 'bg-orchid-purple/20 text-orchid-purple border-orchid-purple/30',
    'Accepted': 'bg-emerald-100/50 text-emerald-800',
    'Appointment Scheduled': 'bg-indigo-100/50 text-indigo-800',
    'In Progress': 'bg-purple-100/50 text-purple-800',
    'Ready': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100/50 text-red-800',
};

export default function Dashboard() {
    const { props } = usePage();
    const { auth, stats, recentOrders, measurements, recommendedShops } = props;
    
    const latestOrder = recentOrders?.[0];

    return (
        <AuthenticatedLayout
            header={
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black leading-tight bg-gradient-to-r from-orchid-purple via-orchid-blue to-pink-500 bg-clip-text text-transparent drop-shadow-lg"
                >
                    Welcome back, {auth.user.name} ✨
                </motion.h2>
            }
        >
            <Head title="Dashboard" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.2
                        }
                    }
                }}
                className="py-6 space-y-8"
            >
                {/* Style Stats */}
                <motion.div 
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <StatCard 
                        title="Active Orders" 
                        value={stats?.active || 0}
                        variant="pending"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Ready for Pickup" 
                        value={stats?.ready || 0}
                        variant="revenue"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Total Spent" 
                        value={`₱${Number(stats?.totalSpent || 0).toLocaleString('en-US')}`}
                        variant="growth"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    />
                </motion.div>

                {/* Current Order Progress */}
                {latestOrder && !['Completed', 'Cancelled'].includes(latestOrder.status) && (
                    <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                        className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-orchid-purple to-orchid-blue rounded-3xl flex items-center justify-center shadow-2xl">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent">Order #{latestOrder.id}</h3>
                                    <p className="text-stone-600 font-medium">{latestOrder.tailoring_shop?.shop_name || 'Your tailor'}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-2xl font-bold text-sm ${STATUS_COLORS[latestOrder.status]}`}>
                                {latestOrder.status}
                            </span>
                        </div>

                        <OrderProgress status={latestOrder.status} />
                    </motion.div>
                )}

                {/* My Fit Card */}
                <motion.div 
                    variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
                    className="bg-gradient-to-br from-slate-50/70 to-slate-100/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 shadow-xl"
                >
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center shadow-2xl">
                            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">Your Perfect Fit</h3>
                            {measurements && (measurements.chest || measurements.waist || measurements.neck) ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    {measurements.chest && (
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                            <span className="font-mono text-slate-600">Chest</span>
                                            <div className="text-2xl font-black text-slate-900">{measurements.chest}"</div>
                                        </div>
                                    )}
                                    {measurements.waist && (
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                            <span className="font-mono text-slate-600">Waist</span>
                                            <div className="text-2xl font-black text-slate-900">{measurements.waist}"</div>
                                        </div>
                                    )}
                                    {measurements.neck && (
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                            <span className="font-mono text-slate-600">Neck</span>
                                            <div className="text-2xl font-black text-slate-900">{measurements.neck}"</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 text-center border-2 border-dashed border-slate-300"
                                >
                                    <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <h4 className="text-xl font-bold text-slate-700 mb-2">Define Your Silhouette</h4>
                                    <p className="text-slate-600 mb-6">Update your measurements for perfect tailor quotes.</p>
                                    <Link 
                                        href="/profile" 
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-950 to-slate-800 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-slate-900/25 transition-all duration-300 text-sm hover:scale-105"
                                    >
                                        Update Measurements
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </motion.div>
                            )}
                            {measurements && (
                                <Link href="/profile" className="mt-6 inline-block text-sm font-bold text-orchid-purple hover:text-orchid-blue underline">
                                    Edit Measurements →
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                    <Link href="/" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orchid-purple/10 to-orchid-blue/10 p-8 border border-orchid-purple/20 hover:border-orchid-purple/40 hover:shadow-2xl hover:shadow-orchid-purple/25 transition-all duration-500 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-orchid-purple/5 to-orchid-blue/5 scale-125 group-hover:scale-100 transition-transform duration-700 -z-10" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-orchid-purple to-orchid-blue rounded-2xl flex items-center justify-center mb-4 shadow-xl group-hover:shadow-2xl group-hover:shadow-orchid-purple/50 transition-shadow">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent mb-2">Browse Shops</h4>
                            <p className="text-stone-600 font-medium">Discover tailors near you</p>
                        </div>
                    </Link>

                    <Link href="/profile" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50/80 to-slate-100/80 p-8 border border-slate-200/50 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 scale-125 group-hover:scale-100 transition-transform duration-700 -z-10" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl group-hover:shadow-2xl group-hover:shadow-slate-400/50 transition-shadow">
                                <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Update Measurements</h4>
                            <p className="text-stone-600 font-medium">Perfect fit every time</p>
                        </div>
                    </Link>

                    <Link href="/my-orders" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 p-8 border border-emerald-200/50 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 scale-125 group-hover:scale-100 transition-transform duration-700 -z-10" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl group-hover:shadow-2xl group-hover:shadow-emerald-500/50 transition-shadow">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.42 3.42v5.638a3.42 3.42 0 01-3.42 3.42h-7.278a3.42 3.42 0 01-3.42-3.42V8.117a3.42 3.42 0 013.42-3.42z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent mb-2">Track Orders</h4>
                            <p className="text-stone-600 font-medium">See live updates</p>
                        </div>
                    </Link>
                </motion.div>

                {/* Recent Orders & Recommended Shops keep existing but glassify */}
                {recentOrders && recentOrders.length > 0 && (
                    <motion.div 
                        variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}
                        className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-100/50 p-8 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent flex items-center gap-3">
                                <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Recent Orders
                            </h3>
                            <Link href="/my-orders" className="text-lg font-bold bg-gradient-to-r from-orchid-purple to-orchid-blue bg-clip-text text-transparent hover:underline">
                                View All →
                            </Link>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm divide-y divide-stone-100/50">
                                <thead className="bg-stone-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-stone-500 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-stone-500 uppercase tracking-wider">Shop</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-stone-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-stone-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100/50">
                                    {recentOrders.slice(0, 4).map((order) => (
                                        <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-6 py-5 font-bold text-stone-900">#{order.id}</td>
                                            <td className="px-6 py-5 text-stone-700">{order.tailoring_shop?.shop_name || 'N/A'}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1.5 rounded-full font-bold text-sm shadow-sm ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-800'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-xl bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent">
                                                ₱{Number(order.total_price || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Recommended Shops Grid */}
                {recommendedShops && recommendedShops.length > 0 && (
                    <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                        className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-100/50 p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent flex items-center gap-3">
                                <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.65 9.65L7 18l-4.95-4.95a7 7 0 010-9.65zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                Featured Tailors
                            </h3>
                            <Link href="/" className="text-lg font-bold bg-gradient-to-r from-orchid-purple to-orchid-blue bg-clip-text text-transparent hover:underline">
                                See All →
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedShops.map((shop) => (
                                <motion.div 
                                    key={shop.id}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/80 p-8 border border-white/50 hover:border-orchid-purple/30 shadow-xl hover:shadow-2xl hover:shadow-orchid-purple/20 transition-all duration-500 backdrop-blur-xl cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-orchid-purple/0 via-orchid-blue/0 to-pink-500/0 group-hover:from-orchid-purple/10 group-hover:via-orchid-blue/10 -z-10" />
                                    <div className="relative z-10 flex items-start gap-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-orchid-purple to-orchid-blue rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0 group-hover:rotate-6 transition-transform duration-700">
                                            <span className="text-2xl">👔</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-2">
                                            <h4 className="text-xl font-black bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent group-hover:from-orchid-purple mb-2">
                                                {shop.shop_name}
                                            </h4>
                                            <p className="text-slate-600 font-medium mb-3 leading-tight">{shop.contact_person || 'Expert tailor'}</p>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                                    shop.status === 'approved' ? 'bg-emerald-100/80 text-emerald-800 shadow-emerald-200/50' : 'bg-yellow-100/80 text-yellow-800 shadow-yellow-200/50'
                                                }`}>
                                                    {shop.status === 'approved' ? 'Featured' : 'Rising'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 right-4">
                                        <Link href={`/shop/${shop.id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-950 to-slate-800 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-300 text-sm hover:scale-105 backdrop-blur-sm">
                                            Book Now
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </motion.div>
        </AuthenticatedLayout>
    );
}

