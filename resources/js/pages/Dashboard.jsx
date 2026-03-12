import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-blue-100 text-blue-800',
    'Appointment Scheduled': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

// Progress steps for timeline
const ORDER_STEPS = ['Ordered', 'Accepted', 'Measuring', 'Tailoring', 'Ready'];

const getStepIndex = (status) => {
    switch (status) {
        case 'Pending': return 0;
        case 'Accepted': return 1;
        case 'Appointment Scheduled': return 2;
        case 'In Progress': return 3;
        case 'Ready': return 4;
        case 'Completed': return 4;
        default: return 0;
    }
};

export default function Dashboard() {
    const { props } = usePage();
    const { auth, stats, recentOrders, measurements, recommendedShops } = props;
    
    const latestOrder = recentOrders?.[0];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 space-y-6">
                {/* Welcome Message */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
                    <h1 className="text-2xl font-bold text-stone-800">Welcome back, {auth.user.name}! 👋</h1>
                    <p className="text-stone-600 mt-1">Here's what's happening with your orders.</p>
                </div>

                {/* 1. Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Active Orders Card */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Active Orders</p>
                                <p className="text-3xl font-bold text-amber-600 mt-1">{stats?.active || 0}</p>
                                <p className="text-xs text-stone-400 mt-1">Pending, Accepted, In Progress</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Pickup Card */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Ready for Pickup</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{stats?.ready || 0}</p>
                                <p className="text-xs text-stone-400 mt-1">Waiting for you!</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Total Spent</p>
                                <p className="text-3xl font-bold text-stone-700 mt-1">₱{Number(stats?.totalSpent || 0).toFixed(2)}</p>
                                <p className="text-xs text-stone-400 mt-1">On completed orders</p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Active Progress Timeline (Latest Order) */}
                {latestOrder && !['Completed', 'Cancelled'].includes(latestOrder.status) && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-stone-800">Current Order Progress</h3>
                            <span className="text-sm text-stone-500">Order #{latestOrder.id}</span>
                        </div>
                        
                        {/* Order Info */}
                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">👔</div>
                            <div>
                                <p className="font-medium text-stone-800">{latestOrder.tailoring_shop?.shop_name || 'Shop'}</p>
                                <p className="text-sm text-stone-500">{latestOrder.service?.service_name || 'Service'}</p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[latestOrder.status] || 'bg-stone-100 text-stone-800'}`}>
                                    {latestOrder.status}
                                </span>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                {ORDER_STEPS.map((step, index) => {
                                    const currentStep = getStepIndex(latestOrder.status);
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;
                                    
                                    return (
                                        <div key={step} className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                                isCompleted 
                                                    ? 'bg-amber-600 text-white' 
                                                    : 'bg-stone-200 text-stone-400'
                                            } ${isCurrent ? 'ring-4 ring-amber-100' : ''}`}>
                                                {isCompleted ? (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Progress Line Background */}
                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-200 -z-10 transform -translate-y-1/2"></div>
                            {/* Progress Line Active */}
                            <div 
                                className="absolute top-4 left-0 h-0.5 bg-amber-600 -z-10 transform -translate-y-1/2 transition-all duration-500"
                                style={{ width: `${(getStepIndex(latestOrder.status) / (ORDER_STEPS.length - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* 3. Quick Actions Menu */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:bg-stone-50 hover:border-amber-300 transition-all group"
                        >
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-stone-800">Browse Shops</p>
                                <p className="text-xs text-stone-500">Find tailors</p>
                            </div>
                        </Link>

                        <Link
                            href="/profile"
                            className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:bg-stone-50 hover:border-amber-300 transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-stone-800">Update Measurements</p>
                                <p className="text-xs text-stone-500">Save your sizes</p>
                            </div>
                        </Link>

                        <Link
                            href="/my-orders"
                            className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:bg-stone-50 hover:border-amber-300 transition-all group"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-stone-800">Contact Support</p>
                                <p className="text-xs text-stone-500">Get help</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 4. Recent Orders Simplified Table */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-stone-200">
                        <h3 className="text-lg font-semibold text-stone-800">Recent Orders</h3>
                        <Link href="/my-orders" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                            View All →
                        </Link>
                    </div>
                    
                    {recentOrders && recentOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase">Order ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase">Shop</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-medium text-stone-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-stone-50">
                                            <td className="px-5 py-3 font-medium text-stone-800">#{order.id}</td>
                                            <td className="px-5 py-3 text-stone-600">{order.tailoring_shop?.shop_name || 'N/A'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-800'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-amber-700">
                                                ₱{Number(order.total_price || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-stone-500">
                            <p className="font-medium">No orders yet</p>
                            <p className="text-sm mt-1">Start by browsing our tailoring shops!</p>
                            <Link href="/" className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                                Browse Shops
                            </Link>
                        </div>
                    )}
                </div>

                {/* 5. Tailoring Shop Recommendations */}
                {recommendedShops && recommendedShops.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-stone-800">Recommended Shops in Dumaguete</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {recommendedShops.map((shop) => (
                                <Link
                                    key={shop.id}
                                    href={`/shop/${shop.id}`}
                                    className="p-4 rounded-lg border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-lg">
                                            👔
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-stone-800 truncate">{shop.shop_name}</p>
                                            <p className="text-xs text-stone-500">{shop.contact_person || 'Contact shop'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            shop.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {shop.status}
                                        </span>
                                        <span className="text-xs text-amber-600 group-hover:text-amber-700">View →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Measurements Reminder */}
                {(!measurements || !measurements.neck && !measurements.waist) && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-amber-800">Don't forget your measurements!</h4>
                                <p className="text-sm text-amber-700 mt-1">Save your body measurements to get more accurate quotes from tailors.</p>
                                <Link href="/profile" className="inline-block mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline">
                                    Update Measurements →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

