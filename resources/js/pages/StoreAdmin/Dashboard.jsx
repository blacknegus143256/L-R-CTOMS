import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/Dashboard/StatCard';
import OrderHeatmap from '@/Components/Dashboard/OrderHeatmap';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
    'Pending': 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-800 backdrop-blur-sm border border-yellow-200/50',
    'Accepted': 'bg-gradient-to-r from-blue-400/20 to-indigo-400/20 text-blue-800 backdrop-blur-sm border border-blue-200/50',
    'Appointment Scheduled': 'bg-gradient-to-r from-indigo-400/20 to-purple-400/20 text-indigo-800 backdrop-blur-sm border border-indigo-200/50',
    'In Progress': 'bg-gradient-to-r from-purple-400/20 to-violet-400/20 text-purple-800 backdrop-blur-sm border border-purple-200/50',
    'Ready': 'bg-gradient-to-r from-emerald-400/20 to-green-400/20 text-emerald-800 backdrop-blur-sm border border-emerald-200/50',
    'Completed': 'bg-gradient-to-r from-slate-400/20 to-stone-400/20 text-stone-800 backdrop-blur-sm border border-stone-200/50',
    'Cancelled': 'bg-gradient-to-r from-red-400/20 to-rose-400/20 text-red-800 backdrop-blur-sm border border-red-200/50',
};

// Calculate time remaining until deadline
const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Overdue! 🔥';
    if (diffHours < 1) return 'Less than 1h ⏰';
    if (diffHours < 24) return `Due in ${diffHours}h`;
    if (diffDays === 1) return 'Tomorrow 📅';
    return `Due in ${diffDays}d`;
};

const getTimeColor = (deadline) => {
    if (!deadline) return 'text-stone-500 font-medium';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) return 'text-red-600 font-bold animate-pulse';
    if (diffHours < 6) return 'text-red-500 font-bold';
    if (diffHours < 24) return 'text-orange-500 font-semibold';
    return 'text-emerald-600 font-semibold';
};

export default function Dashboard() {
    const { props } = usePage();
    const { shop, stats, topServices, topMaterials, urgentOrders, recentActivity } = props;

    const [description, setDescription] = useState(shop?.description || '');
    const [editingDescription, setEditingDescription] = useState(false);

    const updateDescription = () => {
        router.post('/store/update-description', { description }, {
            preserveState: true,
            onSuccess: () => {
                setEditingDescription(false);
            },
        });
    };
    const [filteredUrgentOrders, setFilteredUrgentOrders] = useState(urgentOrders || []);

    const handleDayFilter = (dayName) => {
        if (dayName === 'All') {
            setFilteredUrgentOrders(urgentOrders || []);
        } else {
            setFilteredUrgentOrders((urgentOrders || []).filter(order => {
                const date = new Date(order.expected_completion_date);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return dayNames[date.getDay()] === dayName;
            }));
        }
    };

    const handleMarkReady = (orderId) => {
        if (confirm('Mark this order as ready for pickup?')) {
            router.patch(`/store/orders/${orderId}/status`, { status: 'Ready' }, {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
            });
        }
    };

    // Calculate max for bar chart
    const maxServiceCount = Math.max(...(topServices?.map(s => s.total) || [1]), 1);
    const maxMaterialCount = Math.max(...(topMaterials?.map(m => m.total) || [1]), 1);

    if (!shop) {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Store Dashboard</h2>}
            >
                <Head title="Store Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-slate-50 to-white backdrop-blur-xl shadow-2xl sm:rounded-3xl p-12 text-center border border-slate-200/50">
                            <div className="text-8xl mb-8 mx-auto w-32 h-32 bg-slate-200/50 rounded-3xl flex items-center justify-center">🏪</div>
                            <h3 className="text-4xl font-black text-slate-900 mb-6 leading-tight">No Shop Assigned</h3>
                            <p className="text-2xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">Your account doesn't have a tailoring shop assigned yet. Contact the administrator to activate your business dashboard.</p>
                            <Link 
                                href="/profile"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-3xl text-lg hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                            >
                                Contact Admin
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-6 pr-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 bg-clip-text text-transparent">
                            {shop.shop_name}
                        </h2>
                        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg ring-2 ring-emerald-300/50 backdrop-blur-sm animate-pulse">
                            LIVE
                        </span>
                    </div>
                    <div className="text-emerald-700 text-sm font-bold bg-emerald-100/80 px-4 py-1.5 rounded-xl shadow-md">
                        {shop.address}
                    </div>
                </div>
            }
        >
            <Head title={`${shop.shop_name} Dashboard`} />

            <div className="py-12 space-y-10">
                {/* Command Header */}
                <div className="bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-10 border border-emerald-200/60">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent leading-tight">
                                Command Center
                            </h1>
                            <p className="text-xl text-slate-600 font-semibold max-w-2xl">Real-time business intelligence • Orders • Revenue • Production</p>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <Link
                                href="/store/inventory"
                                className="px-10 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black rounded-3xl text-lg shadow-2xl hover:shadow-3xl hover:shadow-slate-900/60 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm flex items-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0h8v4h-8v12H4V11H0V7h8V1h8v6h8z" />
                                </svg>
                                Inventory
                            </Link>
                            <Link
                                href={route('store.orders.page', shop.id)}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-3xl text-lg shadow-2xl hover:shadow-3xl hover:shadow-emerald-900/60 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm flex items-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2m-3 5h6m-6 4h6m-8 0h8m-8 0v1m8 0v1" />
                                </svg>
                                All Orders
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Revenue Intelligence Grid */}
                <div className="grid grid-cols-1 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-1 gap-8">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₱${Number(stats?.totalRevenue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        variant="revenue"
                        sparkle={true}
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Pending Orders" 
                        value={stats?.pendingOrders || 0}
                        variant="pending"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Monthly Growth" 
                        value={`${(stats?.monthlyGrowth || 0) > 0 ? '+' : ''}${(stats?.monthlyGrowth || 0).toFixed(1)}%`}
                        changePositive={(stats?.monthlyGrowth || 0) >= 0}
                        variant="growth"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Active Customers" 
                        value={stats?.activeCustomers || 0}
                        variant="customers"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        )}
                    />
                </div>

                {/* Production Heatmap */}
                <OrderHeatmap urgentOrders={urgentOrders} onDayFilter={handleDayFilter} />

                {/* Intelligence Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Services */}
                    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-emerald-200/60 group hover:shadow-emerald-500/25 transition-all duration-700">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">Top Services</h3>
                                <p className="text-lg text-slate-600 font-medium">Last 30 days • Click to analyze</p>
                            </div>
                        </div>
                        {topServices && topServices.length > 0 ? (
                            <div className="space-y-5">
                                {topServices.slice(0, 6).map((item, index) => (
                                    <div key={item.service_id} className="group flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-slate-50/50 to-emerald-50/50 border border-emerald-200/50 hover:from-slate-100 hover:to-emerald-100 hover:shadow-inner transition-all cursor-pointer hover:shadow-emerald-300/30">
                                        <span className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-2xl flex-shrink-0 group-hover:shadow-emerald-500/50 group-hover:scale-105 transition-all">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xl font-bold text-slate-900 truncate">{item.service?.service_name || 'Service'}</span>
                                                <span className="text-2xl font-black text-emerald-700 px-4 py-2 bg-emerald-100/60 rounded-xl shadow-lg">
                                                    {item.total}
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200/60 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-2xl"
                                                    style={{ width: `${Math.min((item.total / maxServiceCount) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-100/50 to-emerald-100/50">
                                <div className="text-center text-slate-500">
                                    <div className="text-7xl mx-auto mb-6 opacity-20">📊</div>
                                    <h4 className="text-3xl font-bold mb-4">No Orders Yet</h4>
                                    <p className="text-xl">Accept your first order to see service performance</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inventory Snapshot */}
                    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-emerald-200/60 group hover:shadow-emerald-500/25 transition-all duration-700">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0h8v4h-8v12H4V11H0V7h8V1h8v6h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">Inventory Levels</h3>
                                <p className="text-lg text-slate-600 font-medium">Stock remaining • Low stock alerts</p>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {topMaterials && topMaterials.length > 0 ? (
                                topMaterials.slice(0, 8).map((item, index) => {
                                    // Mock stock calculation based on usage (higher total = lower stock)
                                    const usageScore = item.total;
                                    const stockPercent = Math.max(0, 95 - usageScore * 2.5); // Adjust formula as needed
                                    const stockStatus = stockPercent > 50 ? 'healthy' : stockPercent > 20 ? 'low' : 'critical';
                                    
                                    return (
                                        <div key={item.attribute_type_id} className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50/50 to-blue-50/50 border border-blue-200/50 hover:shadow-md transition-all hover:shadow-blue-300/30">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-400 rounded-xl flex items-center justify-center text-slate-700 font-bold shadow-md flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-lg text-slate-900">{item.attribute?.name || 'Material'}</span>
                                                    <span className={`font-mono font-bold text-sm px-3 py-1 rounded-lg ${
                                                        stockStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800 shadow-emerald-200/50' :
                                                        stockStatus === 'low' ? 'bg-orange-100 text-orange-800 shadow-orange-200/50' :
                                                        'bg-red-100 text-red-800 shadow-red-200/50'
                                                    }`}>
                                                        {stockStatus.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full shadow-lg transition-all duration-700 ${
                                                            stockStatus === 'healthy' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                                            stockStatus === 'low' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                                                            'bg-gradient-to-r from-red-500 to-rose-600'
                                                        }`}
                                                        style={{ width: `${stockPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="font-mono text-lg font-bold text-slate-800 ml-auto">{stockPercent.toFixed(0)}%</span>
                                        </div>
                                    );
                                })
                            ) : (
                                Array.from({length: 6}, (_, index) => {
                                    const stockPercent = 85 - index * 10;
                                    const stockStatus = stockPercent > 50 ? 'healthy' : stockPercent > 20 ? 'low' : 'critical';
                                    return (
                                        <div key={index} className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50/50 to-blue-50/50 border border-blue-200/50 hover:shadow-md transition-all">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-400 rounded-xl flex items-center justify-center text-slate-700 font-bold shadow-md flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-lg text-slate-900">Material {index + 1}</span>
                                                    <span className={`font-mono font-bold text-sm px-3 py-1 rounded-lg ${
                                                        stockStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800 shadow-emerald-200/50' :
                                                        stockStatus === 'low' ? 'bg-orange-100 text-orange-800 shadow-orange-200/50' :
                                                        'bg-red-100 text-red-800 shadow-red-200/50'
                                                    }`}>
                                                        {stockStatus.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full shadow-lg transition-all duration-700 ${
                                                            stockStatus === 'healthy' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                                            stockStatus === 'low' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                                                            'bg-gradient-to-r from-red-500 to-rose-600'
                                                        }`}
                                                        style={{ width: `${stockPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="font-mono text-lg font-bold text-slate-800 ml-auto">{stockPercent.toFixed(0)}%</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Urgent Orders */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-emerald-200/60">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                <span className="text-2xl text-white font-bold">⚠️</span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-emerald-900">Deadline Alerts</h3>
                                <p className="text-lg text-slate-600 font-semibold">Filtered from heatmap • {filteredUrgentOrders.length} orders</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDayFilter('All')}
                            className="px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-slate-900/60 transition-all text-lg group hover:scale-[1.02] backdrop-blur-sm flex items-center gap-3"
                        >
                            Clear Filter
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {filteredUrgentOrders.length > 0 ? (
                        <div className="space-y-6">
                            {filteredUrgentOrders.map((order) => (
                                <div key={order.id} className="group flex items-center justify-between p-8 bg-gradient-to-r from-red-50/90 to-orange-50/90 rounded-3xl border border-red-200/60 hover:from-red-100/70 hover:shadow-2xl hover:shadow-red-400/40 transition-all duration-500 backdrop-blur-xl shadow-xl">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-3xl font-black text-slate-900">#{order.id}</span>
                                            <span className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-lg backdrop-blur-sm ${STATUS_COLORS[order.status] || 'bg-stone-100/80 text-stone-800 border border-stone-200/50'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800 mb-2">
                                            {order.customer?.name || 'Customer Name'}
                                        </p>
                                        <p className={`text-xl font-bold ${getTimeColor(order.expected_completion_date)} mb-1`}>
                                            {getTimeRemaining(order.expected_completion_date)}
                                        </p>
                                        <p className="text-lg text-slate-600 font-semibold">
                                            {order.service?.service_name || 'Custom Service'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleMarkReady(order.id)}
                                        className="px-12 py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black text-lg rounded-3xl shadow-2xl hover:shadow-3xl hover:shadow-emerald-900/60 hover:scale-105 transition-all duration-300 ml-8 whitespace-nowrap flex items-center gap-3 backdrop-blur-sm border border-emerald-300/50"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Mark Ready
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 backdrop-blur-xl rounded-3xl border-4 border-dashed border-emerald-200/50 bg-emerald-50/50">
                            <svg className="w-24 h-24 text-emerald-500 mx-auto mb-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-4xl font-black text-emerald-900 mb-4">Production Clear</h3>
                            <p className="text-2xl text-emerald-700 font-bold">No urgent deadlines detected</p>
                            <p className="text-xl text-slate-600 mt-2">Your schedule is perfectly balanced</p>
                        </div>
                    )}
                </div>

                {/* Live Feed */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-emerald-200/60">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                            <span className="text-2xl text-white font-bold">📜</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-emerald-900">Live Activity Feed</h3>
                            <p className="text-lg text-slate-600 font-semibold">Recent updates from your shop</p>
                        </div>
                    </div>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="relative space-y-8">
                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-amber-400 to-orange-500 shadow-xl rounded-full" />
                            {recentActivity.slice(0, 10).map((activity, index) => (
                                <motion.div 
                                    key={activity.id}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-8 pl-20 relative group hover:scale-[1.02] transition-all duration-500"
                                >
                                    <div className="absolute left-0 w-8 h-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-amber-500 shadow-2xl ring-4 ring-white flex items-center justify-center group-hover:shadow-emerald-600/60">
                                        <div className="w-4 h-4 bg-white rounded-2xl shadow-lg animate-ping" />
                                    </div>
                                    <div className="flex-1 bg-gradient-to-r from-slate-50/80 to-emerald-50/60 rounded-3xl p-8 shadow-xl border border-emerald-200/50 backdrop-blur-xl group-hover:shadow-2xl group-hover:shadow-emerald-300/40 transition-all duration-500 hover:-translate-y-2">
                                        <div className="text-xl font-black text-slate-900 mb-3 line-clamp-2">{activity.message}</div>
                                        <div className="flex items-center gap-4 text-sm text-stone-500 font-mono">
                                            <span>{activity.time}</span>
                                            <div className="w-2 h-2 bg-stone-400 rounded-full" />
                                            <span className="px-3 py-1 bg-stone-200/60 rounded-xl backdrop-blur-sm text-xs">{activity.type}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 backdrop-blur-xl">
                            <div className="text-8xl mx-auto mb-12 opacity-20 animate-pulse">📜</div>
                            <h4 className="text-4xl font-black text-slate-700 mb-4">Quiet Operations</h4>
                            <p className="text-2xl text-slate-500">No recent activity detected</p>
                            <p className="text-lg text-slate-400 mt-4">Awaiting your next customer</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

