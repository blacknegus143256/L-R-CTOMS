import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Reports({ auth, reports }) {
    const [selected, setSelected] = useState(null);

    const openDetails = (report) => setSelected(report);
    const closeDetails = () => setSelected(null);

    const handleDismiss = async (report) => {
        if (!confirm('Dismiss this report?')) return;
        router.patch(route('super.reports.dismiss', report.id), {}, { preserveState: true });
    };

    const handleTakeAction = async (report) => {
        if (!report.reported?.id) return;

        if (!confirm(`Take action on ${report.reported.name || 'this user'}? This will toggle their account status.`)) {
            return;
        }

        router.patch(route('super.users.toggle-status', report.reported.id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">User Reports</h2>}>
            <Head title="User Reports" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Reports</h3>

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Shop/User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports && reports.data && reports.data.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.reporter?.name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.shop?.shop_name || r.reported?.name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">{r.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{new Date(r.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'investigating' ? 'bg-indigo-100 text-indigo-700' : r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
                                                {r.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-y-2">
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => openDetails(r)} className="py-2 px-3 rounded-md bg-white border text-sm">View Details</button>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDismiss(r)} className="py-2 px-3 rounded-md bg-rose-50 text-rose-700 border">Dismiss</button>
                                                    {r.status === 'pending' && (
                                                        <button
                                                            onClick={() => router.patch(route('super.reports.investigate', r.id), {}, { preserveScroll: true })}
                                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                                        >
                                                            Start Investigation
                                                        </button>
                                                    )}
                                                    {r.reported?.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTakeAction(r)}
                                                            className="py-2 px-3 rounded-md bg-stone-50 text-stone-700 border"
                                                        >
                                                            Take Action
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reports.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-black text-stone-800 mb-1">No reports</h3>
                                                <p className="text-sm text-stone-500 font-medium">There are no reports to display.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {reports && reports.links && (
                            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
                                <div className="text-sm text-stone-600 font-medium">Showing <span className="font-bold text-stone-900">{reports.from || 0}</span> to <span className="font-bold text-stone-900">{reports.to || 0}</span> of <span className="font-bold text-stone-900">{reports.total}</span></div>
                                <div className="flex gap-2">
                                    {reports.links.map((link, idx) => (
                                        <button key={idx} onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })} disabled={!link.url} className={`px-4 py-2 text-sm font-bold rounded-lg border ${link.active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : link.url ? 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50' : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selected && (
                <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">Report Details</h3>
                        <p className="text-sm text-stone-700 mb-4"><strong>Reporter:</strong> {selected.reporter?.name}</p>
                        <p className="text-sm text-stone-700 mb-4"><strong>Reported:</strong> {selected.shop?.shop_name || selected.reported?.name}</p>
                        <p className="text-sm text-stone-700 mb-4"><strong>Reason:</strong> {selected.reason}</p>
                        <div className="border-t pt-4"><p className="text-sm text-stone-700 whitespace-pre-line">{selected.details || 'No additional details provided.'}</p></div>
                        {selected.order_id && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span className="font-bold text-sm">Linked to Order #{selected.order_id}</span>
                                </div>
                                <Link
                                    href={route('super.orders.show', selected.order_id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Inspect Order
                                </Link>
                            </div>
                        )}
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-black text-slate-800 mb-2">Investigation Tools</h4>
                            <p className="text-xs text-slate-600 mb-3">
                                To verify this claim, locate the reported user in the User Management list and use the <strong>Impersonation Tool</strong> to view their order history and messages.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <Link
                                    href={route('super.users.index', { search: selected.reported?.email })}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Find User to Impersonate
                                </Link>
                                <a
                                    href={`mailto:${selected.reported?.email}?subject=Urgent: Account Investigation`}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    Email Reported User
                                </a>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setSelected(null)} className="py-2 px-4 rounded-md bg-stone-900 text-white">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
