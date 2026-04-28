import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function AuditLogOrderView({ auth, order }) {
    const logs = Array.isArray(order?.logs) ? order.logs : [];

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

                <div className="grid md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Status</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{order?.status || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Payment</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{order?.payment_status || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Customer</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{order?.customer?.name || order?.user?.name || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-wider text-stone-500 font-black">Service</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{order?.service?.service_name || 'N/A'}</p>
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
