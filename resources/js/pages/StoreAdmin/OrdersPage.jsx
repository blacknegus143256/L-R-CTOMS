import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/Orders/StatusBadge';
import ViewDetailsModal from '@/Components/Orders/ViewDetailsModal';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

export default function OrdersPage() {
    const { props } = usePage();
    const shopId = props.shopId;
    const shop = props.shop;
    const initialOrders = props.orders || [];
    
    const [orders] = useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [pendingStatusOrder, setPendingStatusOrder] = useState(null);

    // Stats for tabs
    const stats = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        inProgress: orders.filter(o => ['Accepted', 'Appointment Scheduled', 'In Progress'].includes(o.status)).length,
        ready: orders.filter(o => o.status === 'Ready').length,
        completed: orders.filter(o => o.status === 'Completed').length,
    };

    const handleStatusUpdate = (orderId, newStatus, expectedCompletionDate = null) => {
        const payload = { status: newStatus };
        if (expectedCompletionDate) {
            payload.expected_completion_date = expectedCompletionDate;
        }
        
        router.patch(`/store/orders/${orderId}/status`, payload, {
            onSuccess: () => {
                window.location.reload();
            },
            onError: (errors) => {
                alert(errors.message || 'Failed to update status');
            }
        });
    };

    const handleAcceptClick = (order) => {
        if (order.service?.appointment_required) {
            setPendingStatusOrder({ id: order.id, status: 'Appointment Scheduled' });
            setShowAppointmentModal(true);
        } else {
            handleStatusUpdate(order.id, 'Accepted');
        }
    };

    const handleAppointmentSubmit = () => {
        if (!appointmentDate) {
            alert('Please select an appointment date');
            return;
        }
        handleStatusUpdate(pendingStatusOrder.id, pendingStatusOrder.status, appointmentDate);
    };

    const filteredOrders = filterStatus === 'All' 
        ? orders 
        : orders.filter(o => o.status === filterStatus);

    // Tab configuration
    const tabs = [
        { id: 'All', label: 'All Orders', count: stats.all },
        { id: 'Pending', label: 'Pending', count: stats.pending },
        { id: 'In Progress', label: 'In Progress', count: stats.inProgress },
        { id: 'Ready', label: 'Ready', count: stats.ready },
        { id: 'Completed', label: 'Completed', count: stats.completed },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">Orders Management</h1>
                    <p className="text-stone-600">{shop?.shop_name || 'Your Shop'}</p>
                </div>
                <Link
                    href={`/store/dashboard`}
                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-stone-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                filterStatus === tab.id
                                    ? 'border-amber-500 text-amber-600 bg-amber-50'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                filterStatus === tab.id
                                    ? 'bg-amber-200 text-amber-800'
                                    : 'bg-stone-100 text-stone-600'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="p-6">
                    {filteredOrders.length === 0 ? (
                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-stone-500">No orders found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.map(order => (
                                <div key={order.id} className="group flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:border-orchid-blue/40 transition-all hover:shadow-lg gap-4 lg:gap-6">
                                    {/* Left: Identification */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
                                            #{order.id}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-stone-800 leading-tight truncate">{order.service?.service_name || 'N/A'}</h4>
                                            <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                            {order.user?.name && (
                                                <p className="text-sm text-stone-600 truncate">{order.user.name}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Center: Status Badge */}
                                    <div className="hidden lg:block flex-shrink-0">
                                        <StatusBadge status={order.status} />
                                    </div>

                                    {/* Right: Price & Actions */}
                                    <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3 lg:gap-6 w-full sm:w-auto sm:ml-auto">
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-black text-stone-900">₱{Number(order.total_price).toLocaleString()}</p>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Grand Total</p>
                                        </div>

                                        {/* Action Buttons Stack */}
                                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
                                            {/* View Details Arrow */}
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="w-10 h-10 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-orchid-blue group-hover:text-white transition-all shadow-sm flex-shrink-0"
                                            >
                                                →
                                            </button>

                                            {/* Status Actions - Conditional */}
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleAcceptClick(order)}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                            
                                            {order.status === 'Accepted' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'In Progress')}
                                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex-shrink-0 whitespace-nowrap"
                                                >
                                                    Start Work
                                                </button>
                                            )}
                                            
                                            {(order.status === 'Appointment Scheduled' || order.status === 'In Progress') && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Ready')}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex-shrink-0 whitespace-nowrap"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                            
                                            {order.status === 'Ready' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Completed')}
                                                    className="px-4 py-2 bg-stone-600 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition flex-shrink-0 whitespace-nowrap"
                                                >
                                                    Complete
                                                </button>
                                            )}

                                            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                                                    className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition flex-shrink-0 whitespace-nowrap"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Status & Appointment Badge */}
                                    <div className="lg:hidden w-full pt-2 border-t border-stone-100 flex items-center gap-3">
                                        <StatusBadge status={order.status} />
                                        {order.service?.appointment_required && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                📅 Appt Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            <ViewDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={true} />

            {/* Appointment Modal */}
            {showAppointmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAppointmentModal(false)}>
                    <div className="mx-4 max-w-md w-full rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-stone-800 mb-4">Schedule Appointment</h3>
                        <p className="text-sm text-stone-600 mb-4">
                            This service requires an appointment. Please select a date for the customer measurement/consultation.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Appointment Date</label>
                            <input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-800"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAppointmentModal(false);
                                    setAppointmentDate('');
                                    setPendingStatusOrder(null);
                                }}
                                className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAppointmentSubmit}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
