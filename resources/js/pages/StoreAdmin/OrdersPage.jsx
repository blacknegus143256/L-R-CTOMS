
import React, { useState } from 'react';
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

const getOrderTotal = (order) => {
    const servicesTotal = order.orderServices?.reduce((sum, os) => sum + ((Number(os.price) || 0) * (Number(os.quantity) || 1)), 0);
    return Number(servicesTotal || order.total_price || 0);
};

export default function OrdersPage() {
const { props } = usePage();
    const authUser = props.auth?.user || null;
    const shop = props.shop;
    const staffMembers = Array.isArray(props.staffMembers) ? props.staffMembers : [];
    const canAssignStaff = Boolean(props.canAssignStaff);
    const isStaffRoute = Boolean(props.isStaffRoute || authUser?.role === 'store_staff' || authUser?.role === 'staff');
    const ordersRoute = isStaffRoute
        ? route('staff.orders')
        : route('store.orders.page', props.shopId);
    const rawOrders = props.orders || [];
    // Safely extract the array whether backend sends a paginator object or a raw array
    const ordersList = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);

    
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [pendingStatusOrder, setPendingStatusOrder] = useState(null);
    
    const [showMeasurementRequestModal, setShowMeasurementRequestModal] = useState(false);
    const [measurementFields, setMeasurementFields] = useState(['']);

    // Prevent Laravel empty arrays [] from exposing Array.prototype.sort to useState
    const filters = (props.filters && !Array.isArray(props.filters)) ? props.filters : {};

    const [filterStatus, setFilterStatus] = useState(typeof filters.status === 'string' ? filters.status : 'All');
    const [sortBy, setSortBy] = useState(typeof filters.sort === 'string' ? filters.sort : 'newest');

    const [searchTerm, setSearchTerm] = useState(typeof filters.search === 'string' ? filters.search : '');

    const escapeRegExp = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const highlightMatch = (text, term) => {
        if (!term) return text;
        const t = String(term).trim();
        if (t === '') return text;
        const escaped = escapeRegExp(t);
        const parts = String(text).split(new RegExp(`(${escaped})`, 'ig'));
        return parts.map((part, i) => {
            if (part.toLowerCase() === t.toLowerCase()) {
                return (
                    <span key={i} className="bg-amber-100 text-amber-800 px-1 rounded">{part}</span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    // Keep local state in sync when server-provided filters change
    React.useEffect(() => {
        setFilterStatus(filters?.status || 'All');
        setSortBy(filters?.sort || 'newest');
        setSearchTerm(filters?.search || '');
    }, [JSON.stringify(filters)]);

    const applyFilters = (newFilters = {}) => {
        const merged = Object.assign({}, filters, newFilters);
        // reset to first page when applying new filters unless page provided
        if (!Object.prototype.hasOwnProperty.call(merged, 'page')) {
            merged.page = 1;
        }
        router.get(
            ordersRoute,
            merged,
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const executeSearch = () => {
        router.get(
            ordersRoute,
            { ...filters, search: searchTerm, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    };

    const isRecentlyUpdated = (order) => {
        if (!order?.updated_at || !order?.created_at) return false;
        return (
            dayjs(order.updated_at).isAfter(dayjs().subtract(24, 'hours')) &&
            dayjs(order.updated_at).isAfter(dayjs(order.created_at))
        );
    };

    const getOrderAssignees = (order) => {
        const list = Array.isArray(order.assignments) ? order.assignments : [];
        return list;
    };

    const getAssignedStaffName = (order) => {
        const assignees = getOrderAssignees(order);
        return assignees[0]?.name || '';
    };

    const handleAssignStaff = (orderId, assignedStaffId) => {
        router.patch(route('store.orders.assign-staff', orderId), {
            assigned_staff_id: assignedStaffId || null,
        }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['orders', 'stats'] }),
            onError: () => showAlert({
                title: 'Assignment Error',
                message: 'Could not update the assigned staff member.',
                type: 'error',
            }),
        });
    };

    const getOrderStatusText = (order) => order?.status?.name || order?.status || 'Pending';
    // Use global stats calculated by the backend so pagination doesn't break counts
    const stats = props.stats || {
        all: 0,
        requested: 0,
        quoted: 0,
        confirmed: 0,
        pendingPayment: 0,
        readyForProduction: 0,
        inProgress: 0,
        readyToPickUp: 0,
        rush: 0,
        completed: 0,
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
                                onClick={() => { setFilterStatus(tab.id); applyFilters({ status: tab.id, page: 1 }); }}
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

                    <div className="px-4 py-3 border-b border-stone-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-0 gap-4">
                            <div className="relative w-full sm:w-80 flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search Order ID or Customer..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        onKeyDown={handleKeyDown}
                                        className="block w-full pl-10 pr-10 py-2 border border-stone-300 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchTerm('');
                                                router.get(ordersRoute, { ...filters, search: '', page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
                                            }}
                                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600"
                                            title="Clear search"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={executeSearch}
                                    className="px-4 py-2 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-900 transition-colors"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-stone-500">Sort by</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); applyFilters({ sort: e.target.value, page: 1 }); }}
                                    className={`text-xs font-bold rounded-lg px-2.5 py-1.5 bg-white ${sortBy !== 'newest' ? 'border border-indigo-200 text-indigo-600' : 'border border-stone-200 text-stone-700'}`}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="due-soon">Due Soon</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="price-low">Price: Low to High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="p-6">
                        {ordersList.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-stone-200 bg-gradient-to-br from-stone-50 to-white p-12 text-center shadow-sm">
                                {isStaffRoute ? (
                                    <div className="mx-auto max-w-xl">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                                            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 012-2z" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-5 text-2xl font-black text-stone-900">No assigned orders yet</h3>
                                        <p className="mt-3 text-sm leading-6 text-stone-600">
                                            Once the shop owner assigns work to you, it will appear here with status, due date, and customer details.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-stone-500">No orders found.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {ordersList.map(order => {
    const orderStatusText = getOrderStatusText(order);
    const paymentStatus = normalizePaymentStatus(order.payment_status);
    const isFullyCleared = orderStatusText === 'Confirmed' && paymentStatus === 'Paid';
    const latestLog = order.latest_log || order.latestLog || null;
    const latestActor = latestLog?.user?.name || 'System';
    const latestTime = latestLog?.created_at ? dayjs(latestLog.created_at).fromNow() : '';
                    const assignedStaffName = getAssignedStaffName(order);
                    const assignees = getOrderAssignees(order);

    const isExactMatch = (() => {
        if (!searchTerm) return false;
        const s = String(searchTerm).trim().toLowerCase();
        if (!s) return false;
        if (String(order.id) === s) return true;
        const name = (order.user?.name || order.customer?.name || '').toLowerCase();
        if (name === s) return true;
        return false;
    })();

    return (
<div 
        key={order.id} 
        className={`group bg-white p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 w-full relative overflow-hidden ${
            isFullyCleared
                ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/70 to-white ring-1 ring-emerald-200'
                : 'border-stone-200 hover:border-indigo-300'
        } ${isExactMatch ? 'ring-2 ring-amber-300' : ''}`}
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
                        {order.orderServices?.[0]?.service?.service_name?.charAt(0) || '#'}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 font-black text-[10px] uppercase tracking-widest rounded-md">
                        Order #{highlightMatch(order.id, searchTerm)}
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
                    {order.is_rush && (
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
                    {order.orderServices?.[0]?.service?.service_name || 'Custom Service'}
                </h3>
                <p className="text-xs font-bold text-stone-500 truncate flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">👤</span>
                    {order.customer?.name ? highlightMatch(order.customer.name, searchTerm) : (order.user?.name ? highlightMatch(order.user.name, searchTerm) : 'Unknown Customer')}
                </p>
                {assignedStaffName && (
                    <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                            {assignedStaffName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                        </span>
                        Assigned to {assignedStaffName}
                    </p>
                )}
                {assignees.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {assignees.slice(0, 4).map((member) => {
                                const initials = String(member.name || 'S')
                                    .split(' ')
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <span
                                        key={`${order.id}-assignee-${member.id}`}
                                        title={member.name}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-stone-700 text-[10px] font-black text-white shadow"
                                    >
                                        {initials}
                                    </span>
                                );
                            })}
                        </div>
                        <span className="text-[11px] font-medium text-stone-500">
                            {assignees.length} assignee{assignees.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
                {latestLog && (
                    <p className="mt-1 text-[11px] text-stone-500 truncate">
                        Latest activity: {latestLog.description || latestLog.action || 'Order updated'} by {latestActor}{latestTime ? ` (${latestTime})` : ''}
                    </p>
                )}
            </div>
        </div>

        {/* 2. Middle Section: Status & Dates */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-40 shrink-0 gap-2">
            <StatusBadge status={orderStatusText} />
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
                    ₱{Number(getOrderTotal(order)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total</p>
            </div>

            {canAssignStaff && staffMembers.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        value={getOrderAssignees(order)[0]?.id || ''}
                        onChange={(e) => handleAssignStaff(order.id, e.target.value)}
                        className="min-w-40 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Unassigned</option>
                        {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.name}
                            </option>
                        ))}
                    </select>
                    <Link
                        href={route('shop.orders.details', order.id)}
                        className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                        Assignees
                    </Link>
                </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Mobile Price Display (Hidden on Desktop) */}
                <div className="sm:hidden flex-1 text-left">
                    <p className="text-lg font-black text-stone-900 leading-none">₱{Number(getOrderTotal(order)).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>

                {/* Preserved Action Logic */}
                {orderStatusText === 'Pending' && (
                    <>
                        <button onClick={() => handleStatusUpdate(order.id, 'Rejected')} className="hidden sm:block px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                            Reject
                        </button>
                        <button onClick={() => handleAcceptClick(order)} className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 whitespace-nowrap shrink-0">
                            Accept
                        </button>
                    </>
                )}
                {orderStatusText === 'Accepted' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Appointment Scheduled')} className="px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-200 whitespace-nowrap shrink-0">
                        Start Work
                    </button>
                )}
                {(orderStatusText === 'Appointment Scheduled' || orderStatusText === 'In Progress') && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Ready')} className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 whitespace-nowrap shrink-0">
                        Mark Ready
                    </button>
                )}
                {orderStatusText === 'Ready' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'Completed')} className="px-4 py-2.5 bg-stone-800 text-white text-xs font-bold rounded-xl hover:bg-stone-900 transition-all shadow-md whitespace-nowrap shrink-0">
                        Complete
                    </button>
                )}

                {/* Dedicated Workspace Button */}
                <Link 
                    href={isStaffRoute ? route('staff.orders.show', order.id) : route('store.orders.show', order.id)} 
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

                {/* Pagination Controls */}
                {rawOrders?.links && (rawOrders.data?.length > 0) && (
                    <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
                        <div className="text-sm text-stone-600 font-medium">
                            Showing <span className="font-bold text-stone-900">{rawOrders.from || 0}</span> to <span className="font-bold text-stone-900">{rawOrders.to || 0}</span> of <span className="font-bold text-stone-900">{rawOrders.total}</span> orders
                        </div>
                        <div className="flex gap-2">
                            {rawOrders.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                                    disabled={!link.url}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : link.url
                                                ? 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                                : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Modals */}
                {/* ViewDetailsModal removed - using dedicated workspace page */}


            </div>
        </AuthenticatedLayout>
    );
}