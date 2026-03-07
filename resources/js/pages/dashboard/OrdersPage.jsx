import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-stone-100 text-stone-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
    const { shopId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    const fetchOrders = useCallback(() => {
        if (!shopId) return;
        setLoading(true);
        axios.get(`/api/dashboard/shops/${shopId}/orders`)
            .then((res) => {
                setOrders(res.data.data || []);
            })
            .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [shopId]);

    useEffect(() => fetchOrders(), [fetchOrders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/dashboard/shops/${shopId}/orders/${orderId}`, {
                status: newStatus
            });
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to update status');
        }
    };

    const filteredOrders = filterStatus === 'All' 
        ? orders 
        : orders.filter(o => o.status === filterStatus);

    if (loading) return (
        <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
        </div>
    );

    if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-stone-800">Orders</h2>
                <div className="text-sm text-stone-500">
                    {orders.length} total order{orders.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterStatus('All')}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        filterStatus === 'All'
                            ? 'bg-stone-800 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                >
                    All
                </button>
                {STATUS_OPTIONS.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            filterStatus === status
                                ? 'bg-stone-800 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        {status}
                        <span className="ml-1 text-xs opacity-70">
                            ({orders.filter(o => o.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-stone-500">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
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
                                    
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <div className="text-xs text-stone-500 uppercase tracking-wide">Customer</div>
                                            <div className="font-medium text-stone-800">{order.customer?.name || 'N/A'}</div>
                                            {order.customer?.phone_number && (
                                                <div className="text-sm text-stone-600">{order.customer.phone_number}</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs text-stone-500 uppercase tracking-wide">Service</div>
                                            <div className="font-medium text-stone-800">{order.service?.service_name || 'N/A'}</div>
                                            <div className="text-sm text-stone-600">₱{Number(order.service?.price || 0).toFixed(2)} base</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-stone-500 uppercase tracking-wide">Total</div>
                                            <div className="text-xl font-bold text-amber-700">
                                                ₱{Number(order.total_price).toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-stone-500 uppercase tracking-wide">Date</div>
                                            <div className="text-sm text-stone-800">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                            {order.expected_completion_date && (
                                                <div className="text-xs text-stone-500">
                                                    Expected: {new Date(order.expected_completion_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Selected Options</div>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-sm text-amber-800 border border-amber-200">
                                                        {item.attribute?.name || 'Option'}
                                                        {item.price > 0 && (
                                                            <span className="text-amber-600">+₱{Number(item.price).toFixed(2)}</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {order.notes && (
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Notes</div>
                                            <div className="text-sm text-stone-700 bg-stone-50 p-3 rounded-lg">
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
                                            onClick={() => handleStatusUpdate(order.id, 'Accepted')}
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
                                    
                                    {order.status === 'In Progress' && (
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
                                            Complete
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
                                    <div className="font-medium text-stone-800">{selectedOrder.customer?.name || 'N/A'}</div>
                                    {selectedOrder.customer?.phone_number && (
                                        <div className="text-sm text-stone-600">Phone: {selectedOrder.customer.phone_number}</div>
                                    )}
                                    {selectedOrder.customer?.email && (
                                        <div className="text-sm text-stone-600">Email: {selectedOrder.customer.email}</div>
                                    )}
                                    {selectedOrder.customer?.address && (
                                        <div className="text-sm text-stone-600">Address: {selectedOrder.customer.address}</div>
                                    )}
                                </div>
                            </div>

                            {/* Service & Price Breakdown */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Service & Price</h3>
                                <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">{selectedOrder.service?.service_name}</span>
                                        <span className="text-stone-800">₱{Number(selectedOrder.service?.price || 0).toFixed(2)}</span>
                                    </div>
                                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-stone-600">{item.attribute?.name || 'Option'}</span>
                                            <span className="text-stone-800">+₱{Number(item.price || 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                                        <span className="text-stone-800">Total</span>
                                        <span className="text-amber-700">₱{Number(selectedOrder.total_price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Status</h3>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[selectedOrder.status] || 'bg-stone-100 text-stone-800'}`}>
                                        {selectedOrder.status}
                                    </span>
                                    {selectedOrder.expected_completion_date && (
                                        <span className="text-sm text-stone-500">
                                            Expected: {new Date(selectedOrder.expected_completion_date).toLocaleDateString()}
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

                            {/* Quick Status Actions */}
                            <div className="border-t border-stone-200 pt-6">
                                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">Update Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.filter(s => s !== selectedOrder.status).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder.id, status);
                                                setSelectedOrder(null);
                                            }}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                                status === 'Cancelled'
                                                    ? 'border border-red-300 text-red-700 hover:bg-red-50'
                                                    : 'bg-stone-800 text-white hover:bg-stone-700'
                                            }`}
                                        >
                                            Mark as {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

