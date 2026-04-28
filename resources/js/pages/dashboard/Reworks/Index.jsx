import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowRight, Clock3, MessageSquareText, Store } from 'lucide-react';

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

const getStatusTone = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'pending review' || normalized === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (normalized === 'accepted' || normalized === 'approved' || normalized === 'in progress') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (normalized === 'resolved' || normalized === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-stone-100 text-stone-700 border-stone-200';
};

const getNextStep = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'pending review' || normalized === 'pending') return 'Wait for the tailor to review your request.';
    if (normalized === 'accepted' || normalized === 'approved' || normalized === 'in progress') return 'Bring your item back to the shop for the fix.';
    if (normalized === 'resolved' || normalized === 'completed') return 'Your fix is done! Ready for pickup.';
    return 'Check order details for updates.';
};

export default function Index({ auth, reworks = [] }) {
    const normalizedReworks = reworks.map((rework) => ({
        ...rework,
        normalizedStatus: String(rework.status || '').trim().toLowerCase(),
    }));

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">My Reworks</h2>}
        >
            <Head title="My Reworks" />

            <div className="py-12 bg-stone-50 min-h-screen">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-stone-100 p-3 text-stone-700"><Clock3 className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Total Requests</p>
                                    <p className="text-3xl font-black text-stone-900">{reworks.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><MessageSquareText className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Pending Review</p>
                                    <p className="text-3xl font-black text-stone-900">{normalizedReworks.filter((item) => item.normalizedStatus === 'pending review' || item.normalizedStatus === 'pending').length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><Store className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Resolved</p>
                                    <p className="text-3xl font-black text-stone-900">{normalizedReworks.filter((item) => item.normalizedStatus === 'resolved').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {normalizedReworks.length ? normalizedReworks.map((rework) => {
                            const status = rework.normalizedStatus;
                            const statusLabel = status === 'accepted' ? 'Approved' : status === 'resolved' ? 'Resolved' : 'Pending';

                            return (
                                <div key={rework.id} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">{rework.order?.tailoringShop?.shop_name || 'Assigned Shop'}</p>
                                                <h3 className="mt-1 text-xl font-black text-stone-900">{rework.reason_category || 'General'}</h3>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusTone(status)}`}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-stone-600">
                                            <p>
                                                <span className="font-bold text-stone-900">Days Since Request:</span>{' '}
                                                <span className={`font-bold ${getDaysSince(rework.created_at).includes('d') && parseInt(getDaysSince(rework.created_at), 10) > 3 ? 'text-rose-600' : 'text-stone-500'}`}>
                                                    {getDaysSince(rework.created_at)}
                                                </span>
                                            </p>
                                            <p>
                                                <span className="font-bold text-stone-900">Original Order Date:</span> {formatDate(rework.order?.created_at)}
                                            </p>
                                            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-stone-400">Your Next Step:</p>
                                                <p className="text-xs font-bold text-stone-700">{getNextStep(status)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <Link
                                            href={route('customer.orders.show', rework.order_id) + '?tab=rework'}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
                                        >
                                            View Progress
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm md:col-span-2 xl:col-span-3">
                                <p className="text-lg font-black text-stone-900">No rework requests yet</p>
                                <p className="mt-2 text-sm text-stone-600">When you submit a complaint or fix request, it will appear here with the latest status.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}