import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

const order_statuses = {
    requested: { label: 'Requested', color: 'bg-stone-100 text-stone-800' },
    quoted: { label: 'Quoted', color: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
    ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-emerald-100 text-emerald-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-800' },
};

export default function AuditLogOrderView({ auth, order }) {
    const logs = Array.isArray(order?.logs) ? order.logs : [];

    const handleDeepImpersonate = (userId, destinationUrl) => {
        if (!confirm('Impersonate this user and jump to their view of this order?')) return;

        router.post(route('super.impersonate', userId), { redirect_to: destinationUrl });
    };

    const formatTimestamp = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-black text-stone-900">Admin Order View</h2>}
        >
            <Head title={`Admin Order #${order?.id || ''}`} />

            <div className="max-w-6xl mx-auto p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <Link href={route('super.audit-logs.index')} className="text-sm font-bold text-indigo-600 hover:underline">
                        Back to System Audit Logs
                    </Link>
                    <span className="text-sm font-black text-stone-800">Order #{order?.id}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Status</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">
                            {order_statuses[order?.status]?.label || order?.status || 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Payment</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{order?.payment_status || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Customer</span>
                        <span className="font-bold text-stone-900">{order.customer?.name || order.user?.name || 'Customer Juan'}</span>
                        {(order.customer?.user_id || order.user_id) && (
                            <button
                                onClick={() => handleDeepImpersonate(order.customer?.user_id || order.user_id, `/my-orders/${order.id}`)}
                                className="mt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <span>👁️</span> View as Customer
                            </button>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Tailoring Shop</span>
                        <span className="font-bold text-stone-900">{order.shop?.shop_name || 'N/A'}</span>
                        <span className="text-xs text-stone-500">{order.shop?.user?.name || ''}</span>
                        {order.shop?.user_id && (
                            <button
                                onClick={() => handleDeepImpersonate(order.shop.user_id, `/store/order/${order.id}`)}
                                className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <span>👁️</span> View as Shop
                            </button>
                        )}
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Service</p>
                        <p className="text-sm font-bold text-stone-900 mt-1 truncate" title={order?.orderServices?.[0]?.service?.service_name}>
                            {order?.orderServices?.[0]?.service?.service_name || 'Custom Service'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Total Price</span>
                        <span className="font-bold text-stone-900">
                            {order?.total_price ? `₱${parseFloat(order.total_price).toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'Pending Quote'}
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-wider text-stone-700 mb-4">Order Activity Timeline</h3>
                    {logs.length > 0 ? (
                        <div className="space-y-3">
                            {logs.map((log, index) => (
                                <div key={log.id || index} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className="h-3 w-3 rounded-full bg-indigo-600 mt-1" />
                                        {index !== logs.length - 1 && <span className="w-px flex-1 bg-stone-200 mt-1" />}
                                    </div>
                                    <div className="pb-3">
                                        <p className="text-sm font-bold text-stone-900">{log.description || log.action || 'Order updated'}</p>
                                        <p className="text-xs text-stone-500 mt-1">
                                            {log?.user?.name || 'System'} ({log?.user?.role || 'system'}) - {formatTimestamp(log.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-stone-500">No logs available for this order.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
