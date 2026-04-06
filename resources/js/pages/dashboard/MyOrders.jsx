import React, { useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Orders/StatusBadge';
import ViewDetailsModal from '@/Components/Orders/ViewDetailsModal';

export default function MyOrders({ auth, orders = [] }) {
    const [selectedOrder, setSelectedOrder] = useState(null);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">My Orders</h2>}
        >
            <Head title="My Orders" />

            <div className="py-12 bg-stone-50/50 min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2rem] text-center border border-stone-200 shadow-sm">
                                <p className="text-stone-500 font-medium">No orders found.</p>
                                <Link href="/" className="mt-4 inline-block text-indigo-600 font-bold hover:text-indigo-800">
                                    Browse Shop →
                                </Link>
                            </div>
                        ) : (
                            orders.map((order) => {
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
                                        className="group bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/40 flex flex-col md:flex-row items-center justify-between hover:border-indigo-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                                                #{order.id}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-stone-900 text-lg leading-tight">{order.service?.service_name || 'Service'}</h3>
                                                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                                    Placed: {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="my-4 md:my-0 flex flex-col items-center gap-2">
                                            <StatusBadge status={order.status ?? 'Pending'} />
                                            {order.expected_completion_date && (
                                                <span className="text-[10px] font-bold text-indigo-500">
                                                    Est: {new Date(order.expected_completion_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-2xl font-black text-stone-900 leading-none">₱{Number(order.total_price).toLocaleString()}</p>
                                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Total</p>
                                            </div>
                                            
                                            {/* ✨ THE MAGIC BUTTON ✨ */}
                                            {needsMeasurements ? (
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md animate-pulse shadow-indigo-200 whitespace-nowrap"
                                                >
                                                    Submit Measurements
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="w-12 h-12 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-center text-stone-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all flex-shrink-0"
                                                >
                                                    →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {selectedOrder && (
                <ViewDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    isAdmin={false}
                />
            )}
        </AuthenticatedLayout>
    );
}
