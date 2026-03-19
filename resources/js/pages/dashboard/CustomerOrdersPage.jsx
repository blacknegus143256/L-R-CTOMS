import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-blue-100 text-blue-800',
    'Appointment Scheduled': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

export default function CustomerOrdersPage() {
    const { props } = usePage();
    const orders = props.orders || [];
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    // Stats for tabs
    const stats = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        inProgress: orders.filter(o => ['Accepted', 'Appointment Scheduled', 'In Progress'].includes(o.status)).length,
        ready: orders.filter(o => o.status === 'Ready').length,
        completed: orders.filter(o => o.status === 'Completed').length,
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

    if (orders.length === 0) return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">My Orders</h1>
                    <p className="text-stone-600">Track your tailoring orders</p>
                </div>
            </div>
            
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-stone-500 mb-4">You haven't placed any orders yet.</p>
                <Link 
                    href="/" 
                    className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700"
                >
                    Browse Shops
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">My Orders</h1>
                    <p className="text-stone-600">Track your tailoring orders</p>
                </div>
                <Link 
                    href="/" 
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                    Browse More Shops
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
                                            </div>
                                            
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Shop</div>
                                                    <div className="font-medium text-stone-800">{order.tailoring_shop?.shop_name || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide">Service</div>
                                                    <div className="font-medium text-stone-800">{order.service?.service_name || 'N/A'}</div>
                                                    <div className="text-sm text-stone-600">
                                                        ₱{Number(order.service?.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </div>
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
                                                            📅 Expected: {new Date(order.expected_completion_date).toLocaleDateString()}
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
Number(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {order.notes && (
                                                <div className="mt-3 pt-3 border-t border-stone-100">
                                                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Your Notes</div>
                                                    <div className="text-sm text-stone-700 bg-stone-50 p-2 rounded-lg">
                                                        {order.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="ml-4">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                                            >
                                                View Details
                                            </button>
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
                            {/* Shop Info */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Shop</h3>
                                <div className="bg-stone-50 rounded-lg p-4">
                                    <div className="font-medium text-stone-800">{selectedOrder.tailoring_shop?.shop_name || 'N/A'}</div>
                                    {selectedOrder.tailoring_shop?.contact_number && (
                                        <div className="text-sm text-stone-600">Phone: {selectedOrder.tailoring_shop.contact_number}</div>
                                    )}
                                    {selectedOrder.tailoring_shop?.address && (
                                        <div className="text-sm text-stone-600">Address: {selectedOrder.tailoring_shop.address}</div>
                                    )}
                                </div>
                            </div>

                            {/* Service & Price */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Service & Price</h3>
                                <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">{selectedOrder.service?.service_name}</span>
                                        <span className="text-stone-800">₱{Number(selectedOrder.service?.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>
                                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-stone-600">+ {item.attribute?.name || 'Option'}</span>
                                            <span className="text-stone-800">₱{Number(item.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                                        <span className="text-stone-800">Total</span>
                                        <span className="text-stone-800">₱{Number(selectedOrder.total_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                                            📅 Expected Completion: {new Date(selectedOrder.expected_completion_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedOrder.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Your Notes</h3>
                                    <div className="bg-stone-50 rounded-lg p-4 text-stone-700">
                                        {selectedOrder.notes}
                                    </div>
                                </div>
                            )}

                            {/* What to expect */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-amber-800 mb-2">What to expect</h3>
                                <div className="text-sm text-amber-700 space-y-1">
                                    {selectedOrder.status === 'Pending' && <p>Your order is waiting for the shop to accept it.</p>}
                                    {selectedOrder.status === 'Accepted' && <p>The shop has accepted your order and will start working on it soon.</p>}
                                    {selectedOrder.status === 'Appointment Scheduled' && <p>Please visit the shop on the scheduled appointment date for measurements/consultation.</p>}
                                    {selectedOrder.status === 'In Progress' && <p>Your order is being worked on. We'll notify you when it's ready.</p>}
                                    {selectedOrder.status === 'Ready' && <p>Your order is ready for pickup! Please visit the shop to get your items.</p>}
                                    {selectedOrder.status === 'Completed' && <p>Thank you for your order!</p>}
                                    {selectedOrder.status === 'Cancelled' && <p>This order has been cancelled.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

