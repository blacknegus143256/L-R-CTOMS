import React, { useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Orders/StatusBadge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const normalizePaymentStatus = (status) => {
    if (!status) return 'Pending';
    return String(status).trim();
};

const PAYMENT_STATUS_CLASSES = {
    Pending: 'bg-stone-100 text-stone-700 border border-stone-200',
    Partial: 'bg-amber-100 text-amber-800 border border-amber-300',
    Paid: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
};

export default function MyOrders({ auth, orders = [] }) {


    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    const isRecentlyUpdated = (order) => {
        if (!order?.updated_at || !order?.created_at) return false;
        return (
            dayjs(order.updated_at).isAfter(dayjs().subtract(24, 'hours')) &&
            dayjs(order.updated_at).isAfter(dayjs(order.created_at))
        );
    };

    const filteredOrders = orders.filter(o => {
        const paymentStatus = normalizePaymentStatus(o.payment_status);
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Requested') return ['Requested'].includes(o.status);
        if (filterStatus === 'Quoted') return ['Quoted'].includes(o.status);
        if (filterStatus === 'Confirmed') return ['Confirmed'].includes(o.status);
        if (filterStatus === 'Pending Payment') return o.status === 'Confirmed' && paymentStatus === 'Pending';
        if (filterStatus === 'Ready for Production') return o.status === 'Ready for Production';
        if (filterStatus === 'Ready to Pick Up') return ['Ready for Pickup', 'Ready to Pick Up', 'Ready'].includes(o.status);
        if (filterStatus === 'Rush') return !!o.rush_order;
        if (filterStatus === 'In Progress') return ['Confirmed', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready'].includes(o.status);
        if (filterStatus === 'Completed') return o.status === 'Completed';
        return true;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'oldest') {
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === 'due-soon') {
            const aDue = a.expected_completion_date ? new Date(a.expected_completion_date).getTime() : Number.MAX_SAFE_INTEGER;
            const bDue = b.expected_completion_date ? new Date(b.expected_completion_date).getTime() : Number.MAX_SAFE_INTEGER;
            return aDue - bDue;
        }
        if (sortBy === 'price-high') {
            return Number(b.total_price || 0) - Number(a.total_price || 0);
        }
        if (sortBy === 'price-low') {
            return Number(a.total_price || 0) - Number(b.total_price || 0);
        }

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    const stats = {
        all: orders.length,
        requested: orders.filter(o => o.status === 'Requested').length,
        quoted: orders.filter(o => o.status === 'Quoted').length,
        confirmed: orders.filter(o => o.status === 'Confirmed').length,
        pendingPayment: orders.filter(o => o.status === 'Confirmed' && normalizePaymentStatus(o.payment_status) === 'Pending').length,
        readyForProduction: orders.filter(o => o.status === 'Ready for Production').length,
        readyToPickUp: orders.filter(o => ['Ready forPickup', 'Ready for Pickup', 'Ready to Pick Up', 'Ready'].includes(o.status)).length,
        rush: orders.filter(o => o.rush_order).length,
        inProgress: orders.filter(o => ['Confirmed', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'Completed').length,
    };

    const tabs = [
        { id: 'All', label: 'All Orders', count: stats.all },
        
        { id: 'Requested', label: 'Requested', count: stats.requested },
        { id: 'Quoted', label: 'Quoted', count: stats.quoted },
        { id: 'Confirmed', label: 'Confirmed', count: stats.confirmed },
        { id: 'Pending Payment', label: 'Pending Payment', count: stats.pendingPayment },
        { id: 'Ready for Production', label: 'Ready for Production', count: stats.readyForProduction },
        { id: 'In Progress', label: 'In Progress', count: stats.inProgress },
        { id: 'Ready to Pick Up', label: 'Ready to Pick Up', count: stats.readyToPickUp },
        { id: 'Rush', label: 'Rush Orders', count: stats.rush },
        { id: 'Completed', label: 'Completed', count: stats.completed },

    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">My Orders</h2>}
        >
            <Head title="My Orders" />

            <div className="py-12 bg-stone-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-6">
                        <div className="flex overflow-x-auto border-b border-stone-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                                        filterStatus === tab.id ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${filterStatus === tab.id ? 'bg-indigo-200 text-indigo-900' : 'bg-stone-100 text-stone-600'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-end">
                            <label className="text-xs font-bold text-stone-500 mr-2">Sort by</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs font-bold border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-stone-700"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="due-soon">Due Soon</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="price-low">Price: Low to High</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredOrders.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2rem] text-center border border-stone-200 shadow-sm">
                                <p className="text-stone-500 font-medium">No orders found.</p>
                                <Link href="/" className="mt-4 inline-block text-indigo-600 font-bold hover:text-indigo-800">
                                    Browse Shop →
                                </Link>
                            </div>
                        ) : (
                            sortedOrders.map((order) => {
                                const paymentStatus = normalizePaymentStatus(order.payment_status);
                                const isFullyCleared = order.status === 'Confirmed' && paymentStatus === 'Paid';

                                // 🧠 THE LOGIC: Does this specific order need the customer to do homework?
                                const requested = order.measurement_snapshot?.requested || [];
                                const values = order.measurement_snapshot?.values || {};
                                
                                const needsMeasurements = order.status === 'Accepted' && 
                                                          order.measurement_type === 'profile' && 
                                                          requested.length > 0 &&
                                                          Object.keys(values).length === 0;

                                    return (
    <div 
        key={order.id} 
        className={`group bg-white p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 relative overflow-hidden ${
            isFullyCleared
                ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/70 to-white ring-1 ring-emerald-200'
                : 'border-stone-200 hover:border-indigo-300'
        }`}
    >
        {/* 1. Thumbnail/Avatar */}
        <div className="hidden sm:flex w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-inner items-center justify-center relative">
            {order.design_image ? (
                <img 
                    src={order.design_image.startsWith('http') ? order.design_image : `/storage/${order.design_image}`} 
                    alt="Design" 
                    className="w-full h-full object-cover" 
                />
            ) : (
                <span className="text-2xl sm:text-3xl font-black text-stone-300 uppercase">
                    {order.service?.service_name?.charAt(0) || 'O'}
                </span>
            )}
        </div>

        {/* 2. Core Information (Service, Shop, Date) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 font-black text-[10px] uppercase tracking-widest rounded-md">
                        Order #{order.id}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {order.is_urgent && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 border-2 border-red-400 shadow-sm">
                            🔴 URGENT
                        </span>
                    )}
                    {order.rush_order && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-200">
                            Rush
                        </span>
                    )}
                    {isRecentlyUpdated(order) && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 border border-amber-200">
                            Updated
                        </span>
                    )}
                </div>
                {/* Mobile Status Badge */}
                <div className="sm:hidden flex-shrink-0">
                    <StatusBadge status={order.status ?? 'Pending'} />
                </div>
                <span className={`sm:hidden text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${PAYMENT_STATUS_CLASSES[paymentStatus] || PAYMENT_STATUS_CLASSES.Pending}`}>
                    {paymentStatus}
                </span>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 truncate leading-tight mb-1">
                {order.service?.service_name || 'Custom Service'}
            </h3>
            
<div className="flex items-center gap-2 mt-1.5">
    <div className="w-5 h-5 rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
        {((order.tailoringShop?.logo_url || order.shop?.logo_url) || (order.tailoringShop?.user?.profile?.avatar_url || order.shop?.user?.profile?.avatar_url)) ? (
            <img src={`/storage/${(order.tailoringShop?.logo_url || order.shop?.logo_url) || (order.tailoringShop?.user?.profile?.avatar_url || order.shop?.user?.profile?.avatar_url)}`} alt="Shop" className="w-full h-full object-cover" />
        ) : (
            <span className="text-[10px] font-black text-stone-400 uppercase">
                {(order.tailoringShop?.user?.name || order.shop?.user?.name || order.tailoringShop?.shop_name || order.shop?.shop_name || 'S').charAt(0)}
            </span>
        )}
    </div>
    <p className="text-xs font-bold text-stone-500 truncate">
        {order.tailoringShop?.shop_name || order.shop?.shop_name || 'Assigned Shop'}
    </p>
</div>
        </div>

        {/* 3. Desktop Status & Details */}
        <div className="hidden sm:flex flex-col items-end justify-center shrink-0 w-36 gap-2">
            <StatusBadge status={order.status ?? 'Pending'} />
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${PAYMENT_STATUS_CLASSES[paymentStatus] || PAYMENT_STATUS_CLASSES.Pending}`}>
                {paymentStatus}
            </span>
            {isFullyCleared && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md uppercase tracking-wider text-right">
                    Ready for next logistics step
                </span>
            )}
            {order.expected_completion_date && (
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md text-right">
                    Est: {new Date(order.expected_completion_date).toLocaleDateString()}
                </span>
            )}
        </div>

        {/* 4. Price & Action Button */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-3 sm:pt-0 border-t border-stone-100 sm:border-none gap-4 shrink-0 sm:pl-4">
            <div className="text-left sm:text-right">
                <p className="text-xl font-black text-stone-900 leading-none">
                    ₱{Number(order.total_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
                {/* Dynamic Materials Tag */}
                {order.material_source === 'shop' && ['Requested', 'Pending'].includes(order.status) ? (
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1 bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                        + Materials TBD
                    </p>
                ) : (
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Total Quote</p>
                )}
            </div>
            <Link 
                                href={route('customer.orders.show', order.id)} 
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-50 hover:bg-indigo-50 text-stone-400 hover:text-indigo-600 border border-stone-200 hover:border-indigo-200 flex items-center justify-center transition-all shrink-0 ml-1 group-hover:shadow-sm"
                                title="Manage Order"
                            >
                                <span className="text-lg leading-none mb-0.5">→</span>
                            </Link>
            {/* Conditional Action Buttons (Preserved Logic) */}           
        </div>
    </div>
);
                            })
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

