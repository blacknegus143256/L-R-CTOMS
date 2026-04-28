import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function AuditLogsIndex({ auth, logs }) {
    const [query, setQuery] = useState('');
    const rows = Array.isArray(logs?.data) ? logs.data : [];

    const filteredRows = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return rows;

        return rows.filter((log) => {
            const orderId = String(log?.order_id ?? '');
            const actorName = String(log?.user?.name ?? '').toLowerCase();
            const actorRole = String(log?.user?.role ?? '').toLowerCase();
            return orderId.includes(term) || actorName.includes(term) || actorRole.includes(term);
        });
    }, [rows, query]);

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

    const goToPage = (url) => {
        if (!url) return;
        router.visit(url, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-black text-stone-900">System Audit Logs</h2>}
        >
            <Head title="System Audit Logs" />

            <div className="max-w-7xl mx-auto p-6 space-y-4">
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-2">
                        Search by Order ID or User
                    </label>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. 1204 or juan"
                        className="w-full md:w-96 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-600">Timestamp</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-600">Actor</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-600">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-600">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-stone-600">Order ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredRows.length > 0 ? (
                                    filteredRows.map((log) => (
                                        <tr key={log.id} className="hover:bg-stone-50/80">
                                            <td className="px-4 py-3 text-sm text-stone-700">{formatTimestamp(log.created_at)}</td>
                                            <td className="px-4 py-3 text-sm text-stone-700">
                                                <p className="font-bold text-stone-900">{log?.user?.name || 'System'}</p>
                                                <p className="text-xs text-stone-500 uppercase tracking-wide">{log?.user?.role || 'system'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-indigo-700 font-bold">{log.action || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-stone-700 max-w-xl">{log.description || 'No description'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {log.order_id ? (
                                                    <Link
                                                        href={route('super.orders.show', log.order_id)}
                                                        className="font-black text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        #{log.order_id}
                                                    </Link>
                                                ) : (
                                                    <span className="text-stone-400">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-500">
                                            No logs found for this page/filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 bg-stone-50/70">
                        <p className="text-xs text-stone-600">
                            Showing {logs?.from || 0} to {logs?.to || 0} of {logs?.total || 0} logs
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => goToPage(logs?.prev_page_url)}
                                disabled={!logs?.prev_page_url}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => goToPage(logs?.next_page_url)}
                                disabled={!logs?.next_page_url}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
