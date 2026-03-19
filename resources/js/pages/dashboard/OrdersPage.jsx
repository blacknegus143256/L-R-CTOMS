import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-blue-100 text-blue-800',
    'Appointment Scheduled': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

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
                        <div className="space-y-4">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-semibold text-stone-800">
                                                    Order #{order.id}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-800'}`}>
                                                    {order.status}
                                                </span>
                                                {order.service?.appointment_required && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        📅 Appointment Required
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Customer</div>
                                                    <div className="font-medium text-stone-800">{order.user?.name || 'N/A'}</div>
                                                    {order.customer?.phone_number && (
                                                        <div className="text-sm text-stone-600">{order.user.profile?.phone_number}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Service</div>
                                                    <div className="font-medium text-stone-800">{order.service?.service_name || 'N/A'}</div>
                                                    <div className="font-bold">₱{Number(order.service?.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Total</div>
                                                    <div className="text-xl font-bold text-amber-700">
                                                        ₱{Number(order.total_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Date</div>
                                                    <div className="text-sm text-stone-800">
                                                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    {order.expected_completion_date && (
                                                        <div className="text-xs text-indigo-600 font-medium">
                                                            📅 {new Date(order.expected_completion_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            {order.items && order.items.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-stone-100">
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Selected Options</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map((item, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-sm text-amber-800 border border-amber-200">
                                                                {item.attribute?.name || 'Option'}
                                                                {item.price > 0 && (
                                                                    <span className="font-bold">₱{Number(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {order.notes && (
                                                <div className="mt-3 pt-3 border-t border-stone-100">
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Notes</div>
                                                    <div className="text-sm text-stone-700 bg-stone-50 p-2 rounded-lg">
                                                        {order.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="ml-4 flex flex-col gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                                            >
                                                View Details
                                            </button>
                                            
                                            {/* Status Actions */}
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleAcceptClick(order)}
                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                            
                                            {order.status === 'Accepted' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'In Progress')}
                                                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                                                >
                                                    Start Work
                                                </button>
                                            )}
                                            
                                            {(order.status === 'Appointment Scheduled' || order.status === 'In Progress') && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Ready')}
                                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                            
                                            {order.status === 'Ready' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Completed')}
                                                    className="rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                                                >
                                                    Mark as Complete
                                                </button>
                                            )}

                                            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedOrder(null)}>
                    <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between border-b border-stone-200 p-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-stone-800">Order #{selectedOrder.id}</h2>
                                <p className="text-stone-500">
                                    Placed on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Customer</h3>
                                <div className="bg-stone-50 rounded-lg p-4">
                                    <div className="font-medium text-stone-800">{selectedOrder.user?.name || 'N/A'}</div>
                                    {selectedOrder.user.profile?.phone && (
                                        <div className="text-sm text-stone-600">Phone: {selectedOrder.user.profile.phone}</div>
                                    )}
                                    {selectedOrder.user?.email && (
                                        <div className="text-sm text-stone-600">Email: {selectedOrder.user.email}</div>
                                    )}
                                    {selectedOrder.customer?.address && (
                                        <div className="text-sm text-stone-600">Address: {selectedOrder.customer.address}</div>
                                    )}
                                </div>
                            </div>

                            {/* Service Info */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Service & Price</h3>
                                <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">{selectedOrder.service?.service_name}</span>
                                        <span className="font-bold">₱{Number(selectedOrder.service?.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>
                                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-stone-600">+ {item.attribute?.name || 'Option'}</span>
                                            <span className="font-bold">₱{Number(item.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                                        <span className="text-stone-800">Total</span>
                                        <span>₱{Number(selectedOrder.total_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Status</h3>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[selectedOrder.status] || 'bg-stone-100 text-stone-800'}`}>
                                        {selectedOrder.status}
                                    </span>
                                    {selectedOrder.expected_completion_date && (
                                        <span className="text-sm text-stone-500">
                                            📅 Expected: {new Date(selectedOrder.expected_completion_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedOrder.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Notes</h3>
                                    <div className="bg-stone-50 rounded-lg p-4 text-stone-700">
                                        {selectedOrder.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

