import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
                <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
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

                {/* 1. KPI Cards - Revenue stands out */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue - HIGHLIGHTED */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-5 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-800 font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-700 mt-1">₱{Number(stats?.totalRevenue || 0).toFixed(2)}</p>
                            </div>
                            <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Pending Orders</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.pendingOrders || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Monthly growth */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Monthly Growth</p>
                                <p className={`text-2xl font-bold mt-1 ${(stats?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(stats?.monthlyGrowth || 0)}%
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(stats?.monthlyGrowth || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {(stats?.monthlyGrowth || 0) >= 0 ? (
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Customers */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Active Customers</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.activeCustomers || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Top Services - IMPROVED Bar Charts */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">📊 Best-Ordered Services</h3>
                    {topServices && topServices.length > 0 ? (
                        <div className="space-y-2">
                            {topServices.map((item, index) => (
                                <div 
                                    key={item.service_id} 
                                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    <span className="text-sm font-medium text-stone-400 w-6">{index + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-stone-700">{item.service?.service_name || 'Unknown'}</span>
                                            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                {item.total} {item.total === 1 ? 'order' : 'orders'}
                                            </span>
                                        </div>
                                        <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500 group-hover:from-amber-500 group-hover:to-amber-700"
                                                style={{ width: `${(item.total / maxServiceCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-stone-500 text-center py-4">No service data yet</p>
                    )}
                </div>

                {/* 3. Top Materials - IMPROVED Bar Charts */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">🧵 Most Popular Materials</h3>
                    {topMaterials && topMaterials.length > 0 ? (
                        <div className="space-y-2">
                            {topMaterials.map((item, index) => (
                                <div 
                                    key={item.attribute_type_id} 
                                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    <span className="text-sm font-medium text-stone-400 w-6">{index + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-stone-700">{item.attribute?.name || 'Unknown'}</span>
                                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {item.total} {item.total === 1 ? 'use' : 'uses'}
                                            </span>
                                        </div>
                                        <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 group-hover:from-blue-500 group-hover:to-blue-700"
                                                style={{ width: `${(item.total / maxMaterialCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-stone-500 text-center py-4">No material data yet</p>
                    )}
                </div>

                {/* 4. Urgent Orders - IMPROVED with Countdown */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">⚠️</span>
                        <h3 className="text-lg font-semibold text-stone-800">Orders Nearing Deadline</h3>
                    </div>
                    {urgentOrders && urgentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {urgentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-stone-800">Order #{order.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-800'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-stone-600">
                                            Customer: {order.customer?.name || 'N/A'}
                                        </p>
                                        <p className={`text-xs font-medium ${getTimeColor(order.expected_completion_date)}`}>
                                            {getTimeRemaining(order.expected_completion_date)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleMarkReady(order.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                    >
                                        Mark Ready
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-stone-500">
                            <span className="text-3xl">✅</span>
                            <p className="mt-2 font-medium">No urgent orders</p>
                            <p className="text-sm">All orders are on schedule!</p>
                        </div>
                    )}
                </div>

                {/* 5. Recent Activity - TIMELINE Style */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">📜 Recent Activity</h3>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="relative">
                            {/* Vertical dashed line */}
                            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-stone-300"></div>
                            
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="relative flex items-start gap-4 pl-6">
                                        {/* Amber dot on the timeline */}
                                        <div className="absolute left-0 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-sm"></div>
                                        
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm text-stone-700">{activity.message}</p>
                                            <p className="text-xs text-stone-400 mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-stone-500 text-center py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

