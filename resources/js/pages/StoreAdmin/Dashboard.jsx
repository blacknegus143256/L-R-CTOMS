import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/Dashboard/StatCard';
import { Head, Link, router, usePage } from '@inertiajs/react';

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-blue-100 text-blue-800',
    'Appointment Scheduled': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

// Calculate time remaining until deadline
const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Overdue!';
    if (diffHours < 1) return 'Less than 1 hour';
    if (diffHours < 24) return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
};

const getTimeColor = (deadline) => {
    if (!deadline) return 'text-stone-500';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) return 'text-red-600 font-bold';
    if (diffHours < 6) return 'text-red-500 font-semibold';
    if (diffHours < 24) return 'text-orange-500 font-medium';
    return 'text-amber-600';
};

// Order Heatmap Component
const OrderHeatmap = ({ urgentOrders }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getDayIndex = (deadline) => {
        const deadlineDate = new Date(deadline);
        return deadlineDate.getDay() || 7; // Sunday as 7
    };

    const dayOrders = days.map((_, index) => urgentOrders.filter(order => {
        const dayIndex = getDayIndex(order.expected_completion_date);
        return dayIndex === index + 1;
    }).length);

    return (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Orders This Week (Urgent)
            </h3>
            <div className="flex items-end gap-2 h-20">
                {days.map((day, index) => {
                    const urgencyCount = dayOrders[index];
                    const isUrgent = urgencyCount > 0;
                    return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full h-16 rounded-t-xl transition-all duration-500 flex items-end justify-center ${isUrgent ? 'shadow-lg' : ''}`}>
                                {Array.from({length: Math.min(urgencyCount, 5)}).map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-3 h-3 mx-0.5 rounded-sm animate-pulse ${urgencyCount > 3 ? 'bg-red-500 shadow-red-500/50' : urgencyCount > 1 ? 'bg-orange-500 shadow-orange-500/50' : 'bg-orchid-500 shadow-orchid-500/50'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-medium text-slate-600">{day}</span>
                            <span className="text-xs text-slate-500">{urgencyCount}</span>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">Red = High urgency (3+), Pulse = Due soon</p>
        </div>
    );
};

export default function Dashboard() {
    const { props } = usePage();
    const { shop, stats, topServices, topMaterials, urgentOrders, recentActivity } = props;

    const handleMarkReady = (orderId) => {
        if (confirm('Mark this order as ready for pickup?')) {
            router.patch(`/store/orders/${orderId}/status`, { status: 'Ready' }, {
                preserveScroll: true,
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
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8 text-center">
                            <div className="text-6xl mb-4">🏪</div>
                            <h3 className="text-xl font-semibold text-stone-800 mb-2">No Shop Assigned</h3>
                            <p className="text-stone-600 mb-4">You don't have a tailoring shop assigned to your account yet.</p>
                            <p className="text-sm text-stone-500">Contact the administrator to get your shop set up.</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    {shop.shop_name} - Dashboard
                </h2>
            }
        >
            <Head title="Store Dashboard" />

            <div className="py-6 space-y-6">
                {/* Shop Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800">{shop.shop_name}</h1>
                            <p className="text-stone-600">{shop.address}</p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/store/inventory"
                                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
                            >
                                Manage Inventory
                            </Link>
                            <Link
                                href={route('store.orders.page', shop.id)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                            >
                                View Orders
                            </Link>
                        </div>
                    </div>
                </div>

                {/* StatCards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₱${Number(stats?.totalRevenue || 0).toFixed(2)}`}
                        variant="revenue"
                        sparkle={true}
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Pending Orders" 
                        value={stats?.pendingOrders || 0}
                        variant="pending"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Monthly Growth" 
                        value={`${(stats?.monthlyGrowth || 0)}%`}
                        trend={stats?.monthlyGrowth || 0}
                        changePositive={(stats?.monthlyGrowth || 0) >= 0}
                        variant="growth"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={(stats?.monthlyGrowth || 0) >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
                            </svg>
                        )}
                    />
                    <StatCard 
                        title="Active Customers" 
                        value={stats?.activeCustomers || 0}
                        variant="customers"
                        icon={(props) => (
                            <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        )}
                    />
                </div>

                {/* Order Heatmap */}
                <OrderHeatmap urgentOrders={urgentOrders || []} />

                {/* Top Services */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-stone-200/50 p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">📊 Best-Ordered Services</h3>
                    {topServices && topServices.length > 0 ? (
                        <div className="space-y-2">
                            {topServices.map((item, index) => (
                                <div 
                                    key={item.service_id} 
                                    className="group flex items-center gap-3 p-4 rounded-xl hover:bg-stone-50/50 transition-all duration-300 border border-stone-100 hover:border-stone-200 backdrop-blur-sm"
                                >
                                    <span className="text-sm font-medium text-stone-400 w-8">{index + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-stone-800">{item.service?.service_name || 'Unknown'}</span>
                                            <span className="text-sm font-bold text-amber-600 bg-amber-100/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                                {item.total} orders
                                            </span>
                                        </div>
                                        <div className="h-3 bg-stone-100/50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-md transition-all duration-500 group-hover:shadow-lg"
                                                style={{ width: `${(item.total / maxServiceCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-stone-500 text-center py-8 backdrop-blur-sm">No service data yet</p>
                    )}
                </div>

                {/* Top Materials */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-stone-200/50 p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">🧵 Most Popular Materials</h3>
                    {topMaterials && topMaterials.length > 0 ? (
                        <div className="space-y-2">
                            {topMaterials.map((item, index) => (
                                <div 
                                    key={item.attribute_type_id} 
                                    className="group flex items-center gap-3 p-4 rounded-xl hover:bg-stone-50/50 transition-all duration-300 border border-stone-100 hover:border-stone-200 backdrop-blur-sm"
                                >
                                    <span className="text-sm font-medium text-stone-400 w-8">{index + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-stone-800">{item.attribute?.name || 'Unknown'}</span>
                                            <span className="text-sm font-bold text-blue-600 bg-blue-100/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                                {item.total} uses
                                            </span>
                                        </div>
                                        <div className="h-3 bg-stone-100/50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-md transition-all duration-500 group-hover:shadow-lg"
                                                style={{ width: `${(item.total / maxMaterialCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-stone-500 text-center py-8 backdrop-blur-sm">No material data yet</p>
                    )}
                </div>

                {/* Urgent Orders - Glass Effect */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/50 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl animate-pulse">⚠️</span>
                        <h3 className="text-xl font-bold text-stone-800">Orders Nearing Deadline</h3>
                    </div>
                    {urgentOrders && urgentOrders.length > 0 ? (
                        <div className="space-y-4">
                            {urgentOrders.map((order) => (
                                <div key={order.id} className="group flex items-center justify-between p-6 bg-gradient-to-r from-red-50/80 to-orange-50/80 rounded-xl border border-red-200/50 hover:from-red-100/60 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-xl text-stone-900">Order #{order.id}</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm ${STATUS_COLORS[order.status] || 'bg-stone-100/80 text-stone-800'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-lg font-semibold text-stone-700">
                                            Customer: {order.customer?.name || 'N/A'}
                                        </p>
                                        <p className={`text-sm font-bold mt-1 ${getTimeColor(order.expected_completion_date)} animate-pulse`}>
                                            {getTimeRemaining(order.expected_completion_date)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleMarkReady(order.id)}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm backdrop-blur-sm"
                                    >
                                        Mark Ready
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-stone-500/80 backdrop-blur-sm">
                            <span className="text-6xl mb-4">✅</span>
                            <p className="text-2xl font-bold mb-2 text-emerald-600">No urgent orders</p>
                            <p className="text-lg">All orders are on schedule!</p>
                        </div>
                    )}
                </div>

                {/* Recent Activity - Glass Timeline */}
                <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-stone-100/50 p-6">
                    <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                        <span className="text-2xl">📜</span>
                        Recent Activity
                    </h3>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="relative">
                            {/* Vertical dashed line */}
                            <div className="absolute left-4 top-8 bottom-8 w-px bg-gradient-to-b from-amber-400 to-amber-600 shadow-inner"></div>
                            
                            <div className="space-y-6">
                                {recentActivity.map((activity, index) => (
                                    <div key={activity.id} className="relative flex items-start gap-6 pl-10 group hover:scale-[1.02] transition-all duration-300">
                                        {/* Pulsing dot */}
                                        <div className="absolute left-0 w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border-4 border-white shadow-lg ring-2 ring-amber-200/50 animate-pulse group-hover:animate-ping">
                                            <div className="w-3 h-3 bg-white rounded-full mx-auto mt-1 shadow-sm"></div>
                                        </div>
                                        
                                        <div className="flex-1 pb-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-stone-100/50 shadow-sm hover:shadow-md transition-all duration-300 ml-2">
                                            <p className="text-stone-800 font-semibold">{activity.message}</p>
                                            <p className="text-sm text-stone-500 mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 backdrop-blur-sm">
                            <p className="text-stone-500 text-lg font-medium">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

