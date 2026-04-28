import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowRight, ClipboardList, Clock3, CheckCircle2 } from 'lucide-react';

const formatDate = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getDaysSince = (dateString) => {
    const start = new Date(dateString);
    const now = new Date();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
};

const normalizeStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();

    if (['pending', 'pending review'].includes(normalized)) return 'Pending';
    if (['approved', 'accepted', 'in progress'].includes(normalized)) return 'Approved';
    if (['resolved', 'completed'].includes(normalized)) return 'Resolved';

    return 'Pending';
};

const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'bg-amber-100 text-amber-900 border-amber-200';
        case 'approved':
            return 'bg-indigo-100 text-indigo-900 border-indigo-200';
        case 'resolved':
            return 'bg-emerald-100 text-emerald-900 border-emerald-200';
        default:
            return 'bg-stone-100 text-stone-600 border-stone-200';
    }
};

export default function Index({ auth, reworks = [] }) {
    const normalizedReworks = reworks.map((rework) => ({
        ...rework,
        statusLabel: normalizeStatus(rework.status),
    }));

    const pendingReviews = normalizedReworks.filter((item) => item.statusLabel === 'Pending').length;
    const activeReworks = normalizedReworks.filter((item) => item.statusLabel === 'Approved').length;
    const resolved = normalizedReworks.filter((item) => item.statusLabel === 'Resolved').length;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">Rework Queue</h2>}
        >
            <Head title="Rework Queue" />

            <div className="py-12 bg-stone-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Clock3 className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Total Pending</p>
                                    <p className="text-3xl font-black text-stone-900">{pendingReviews}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><ClipboardList className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Active Fixes</p>
                                    <p className="text-3xl font-black text-stone-900">{activeReworks}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Total Resolved</p>
                                    <p className="text-3xl font-black text-stone-900">{resolved}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-stone-200 p-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Management</p>
                                <h3 className="text-2xl font-black text-stone-900">Rework Queue</h3>
                            </div>
                            <div className="rounded-2xl bg-stone-50 px-4 py-2 text-sm font-bold text-stone-600">
                                {normalizedReworks.length} total
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-stone-200">
                                <thead className="bg-stone-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Wait Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Request Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-stone-500">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-[0.2em] text-stone-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 bg-white">
                                    {normalizedReworks.length ? normalizedReworks.map((rework) => (
                                        <tr key={rework.id} className="hover:bg-stone-50/70">
                                            <td className="px-6 py-4 text-sm text-stone-700">
                                                <div className="font-semibold text-stone-900">{rework.order?.customer?.name || rework.order?.user?.name || 'Customer'}</div>
                                                <div className="text-xs text-stone-500">{rework.order?.customer?.email || rework.order?.user?.email || 'No email provided'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-stone-900">
                                                <span className="font-mono">#{rework.order_id}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-700">
                                                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-700">
                                                    {rework.reason_category || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-bold ${getDaysSince(rework.created_at).includes('d') && parseInt(getDaysSince(rework.created_at), 10) > 3 ? 'text-rose-600' : 'text-stone-500'}`}>
                                                    {getDaysSince(rework.created_at)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-700">
                                                {formatDate(rework.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${getStatusStyle(rework.statusLabel)}`}>
                                                    {rework.statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => router.get(route('store.orders.show', rework.order_id), { tab: 'rework' })}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-800"
                                                >
                                                    Manage Fix
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="mx-auto max-w-md rounded-3xl border border-dashed border-stone-200 bg-stone-50 p-8">
                                                    <ClipboardList className="mx-auto h-10 w-10 text-stone-400" />
                                                    <p className="mt-4 text-lg font-black text-stone-900">No rework requests yet</p>
                                                    <p className="mt-2 text-sm text-stone-600">Customer complaints and fixes will appear here once they are submitted.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}