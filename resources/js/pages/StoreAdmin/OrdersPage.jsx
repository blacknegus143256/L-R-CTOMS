
import React, { useState, useEffect } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Orders/StatusBadge';
import { showAlert } from '@/utils/alert';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
// import ViewDetailsModal from '@/Components/Orders/ViewDetailsModal';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Appointment Scheduled', 'Ready for Production', 'In Progress', 'Ready', 'Completed', 'Rejected', 'Declined', 'Cancelled'];

const normalizePaymentStatus = (status) => {
    if (!status) return 'Pending';
    return String(status).trim();
};

const PAYMENT_STATUS_CLASSES = {
    Pending: 'bg-stone-100 text-stone-700 border border-stone-200',
    Partial: 'bg-amber-100 text-amber-800 border border-amber-300',
    Paid: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
};

export default function OrdersPage() {
const { props } = usePage();
    const shop = props.shop;
    const orders = props.orders || []; // Directly use fresh Inertia data

    
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [pendingStatusOrder, setPendingStatusOrder] = useState(null);
    
    const [showMeasurementRequestModal, setShowMeasurementRequestModal] = useState(false);
    const [measurementFields, setMeasurementFields] = useState(['']);

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

    const handleStatusUpdate = (orderId, newStatus, expectedCompletionDate = null) => {
        const payload = { status: newStatus };
        if (expectedCompletionDate) payload.expected_completion_date = expectedCompletionDate;
        
        router.patch(`/store/orders/${orderId}/status`, payload, {
            onSuccess: () => window.location.reload(),
            onError: (errors) => showAlert({
                title: 'Update Error',
                message: errors.message || 'Failed to update status.',
                type: 'error',
            })
        });
    };

    const handleAcceptClick = (order) => {
        setPendingStatusOrder(order);
        if (order.measurement_type === 'profile') {
            // Start with one empty row
            setMeasurementFields(['']); 
            setShowMeasurementRequestModal(true);

        }else if (order.measurement_type === 'scheduled') {
            handleStatusUpdate(order.id, 'Appointment Scheduled');
        } else {
            handleStatusUpdate(order.id, 'Accepted');
        }
    };

    const handleAppointmentSubmit = () => {
        if (!appointmentDate) {
            showAlert({
                title: 'Validation Error',
                message: 'Please select an appointment date.',
                type: 'error',
            });
            return;
        }
        handleStatusUpdate(pendingStatusOrder.id, pendingStatusOrder.status, appointmentDate);
    };

    const handleMeasurementSubmit = () => {
        // Filter out empty rows
        const requestedArr = measurementFields.map(m => m.trim()).filter(Boolean);
        
        if (requestedArr.length === 0) {
            showAlert({
                title: 'Validation Error',
                message: 'Please add at least one measurement part.',
                type: 'error',
            });
            return;
        }
        
        const payload = {
            status: 'Accepted',
            measurement_snapshot: { requested: requestedArr }
        };

        router.patch(`/store/orders/${pendingStatusOrder.id}/status`, payload, {
            onSuccess: () => {
                setShowMeasurementRequestModal(false);
                window.location.reload();
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Orders Management</h1>
                        <p className="text-stone-600">{shop?.shop_name || 'Your Shop'}</p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-stone-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    filterStatus === tab.id ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-ls ${filterStatus === tab.id ? 'bg-indigo-200 text-indigo-800' : 'bg-stone-100 text-black'}`}>
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

                    {/* Orders List */}
                    <div className="p-6">
                        {filteredOrders.length === 0 ? (
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
                                <p className="text-stone-500">No orders found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedOrders.map(order => {
    const paymentStatus = normalizePaymentStatus(order.payment_status);
    const isFullyCleared = order.status === 'Confirmed' && paymentStatus === 'Paid';
    const latestLog = order.latest_log || order.latestLog || null;
    const latestActor = latestLog?.user?.name || 'System';
    const latestTime = latestLog?.created_at ? dayjs(latestLog.created_at).fromNow() : '';

    return (
<div 
        key={order.id} 
        className={`group bg-white p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 w-full relative overflow-hidden ${
            isFullyCleared
                ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/70 to-white ring-1 ring-emerald-200'
                : 'border-stone-200 hover:border-indigo-300'
        }`}
    >
        {/* 1. Left Section: Thumbnail & Core Info */}
        <div className="flex items-center gap-4 w-full lg:w-auto flex-1 min-w-0">
            {/* Thumbnail */}
            <div className="hidden sm:flex w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-100 border border-stone-200 items-center justify-center shrink-0 overflow-hidden shadow-inner">
                {order.design_image ? (
                    <img 
                        src={order.design_image.startsWith('http') ? order.design_image : `/storage/${order.design_image}`} 
                        alt="Design" 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    <span className="text-xl sm:text-2xl font-black text-stone-300 uppercase">
                        {order.service?.service_name?.charAt(0) || '#'}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 font-black text-[10px] uppercase tracking-widest rounded-md">
                        Order #{order.id}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
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
                <h3 className="text-lg font-black text-slate-800 truncate leading-tight mb-1">
                    {order.service?.service_name || 'Custom Service'}
                </h3>
                <p className="text-xs font-bold text-stone-500 truncate flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">👤</span>
                    {order.customer?.name || order.user?.name || 'Unknown Customer'}
                </p>
                {latestLog && (
                    <p className="mt-1 text-[11px] text-stone-500 truncate">
                        Latest activity: {latestLog.description || latestLog.action || 'Order updated'} by {latestActor}{latestTime ? ` (${latestTime})` : ''}
                    </p>
                )}
            </div>
        </div>

        {/* 2. Middle Section: Status & Dates */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-40 shrink-0 gap-2">
            <StatusBadge status={order.status ?? 'Pending'} />
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${PAYMENT_STATUS_CLASSES[paymentStatus] || PAYMENT_STATUS_CLASSES.Pending}`}>
                {paymentStatus}
            </span>
            {isFullyCleared && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Ready for next logistics step
                </span>
            )}
            {order.expected_completion_date && (
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md text-right">
                    Due: {new Date(order.expected_completion_date).toLocaleDateString()}
                </span>
            )}
        </div>

        {/* 3. Right Section: Price & Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t border-stone-100 lg:border-none shrink-0">
            <div className="text-left lg:text-right hidden sm:block">
                <p className="text-xl font-black text-stone-900 leading-none mb-1">
                    ₱{Number(order.total_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Mobile Price Display (Hidden on Desktop) */}
                <div className="sm:hidden flex-1 text-left">
                    <p className="text-lg font-black text-stone-900 leading-none">₱{Number(order.total_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>

                {/* Preserved Action Logic */}
                {order.status === 'Pending' && (
                    <>
                        <button onClick={() => handleStatusUpdate(order.id, 'Rejected')} className="hidden sm:block px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                            Reject
                        </button>
                        <button onClick={() => handleAcceptClick(order)} className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 whitespace-nowrap shrink-0">
                            Accept
                        </button>
                    </>
                )}
                {order.status === 'Accepted' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Appointment Scheduled')} className="px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-200 whitespace-nowrap shrink-0">
                        Start Work
                    </button>
                )}
                {(order.status === 'Appointment Scheduled' || order.status === 'In Progress') && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Ready')} className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 whitespace-nowrap shrink-0">
                        Mark Ready
                    </button>
                )}
                {order.status === 'Ready' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Completed')} className="px-4 py-2.5 bg-stone-800 text-white text-xs font-bold rounded-xl hover:bg-stone-900 transition-all shadow-md whitespace-nowrap shrink-0">
                        Complete
                    </button>
                )}

                {/* Dedicated Workspace Button */}
                <Link 
                    href={route('store.orders.show', order.id)} 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-50 hover:bg-indigo-50 text-stone-400 hover:text-indigo-600 border border-stone-200 hover:border-indigo-200 flex items-center justify-center transition-all shrink-0 ml-1 group-hover:shadow-sm"
                    title="Manage Order"
                >
                    <span className="text-lg leading-none mb-0.5">→</span>
                </Link>
            </div>
        </div>
    </div>
    );
})}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {/* ViewDetailsModal removed - using dedicated workspace page */}


            </div>
        </AuthenticatedLayout>
    );
}