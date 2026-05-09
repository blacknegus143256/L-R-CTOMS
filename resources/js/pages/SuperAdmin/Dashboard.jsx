import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth, stats = {}, urgent_reports = [], recent_logs = [] }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-stone-800 leading-tight">System Overview</h2>}
        >
            <Head title="Super Admin Dashboard" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href={route('super.shops.index')} className="block">
                        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">
                            <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Total Shops</span>
                            <span className="text-3xl font-black text-indigo-600">{stats.total_shops ?? 0}</span>
                        </div>
                    </Link>
                    <Link href={route('super.users.index')} className="block">
                        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">
                            <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Registered Customers</span>
                            <span className="text-3xl font-black text-emerald-600">{stats.total_users ?? 0}</span>
                        </div>
                    </Link>
                    <Link href={route('super.orders.index')} className="block h-full">
                        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col h-full hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                            <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Platform Orders</span>
                            <span className="text-3xl font-black text-blue-600">{stats.total_orders ?? 0}</span>
                        </div>
                    </Link>
                    <Link href={route('super.reports.index')} className="block">
                        <div className={`rounded-2xl p-6 border shadow-sm flex flex-col h-full hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer ${(stats.pending_reports ?? 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-stone-200'}`}>
                            <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Pending Reports</span>
                            <span className={`text-3xl font-black ${(stats.pending_reports ?? 0) > 0 ? 'text-rose-600' : 'text-stone-300'}`}>
                                {stats.pending_reports ?? 0}
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                            <h3 className="font-bold text-stone-800">Action Required: Reports</h3>
                            <Link href={route('super.reports.index')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All →</Link>
                        </div>
                        <div className="p-0">
                            {urgent_reports.length === 0 ? (
                                <div className="p-8 text-center text-sm text-stone-500 font-medium">No pending reports. The platform is secure! 🎉</div>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {urgent_reports.map((report) => (
                                        <div key={report.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">{report.reported?.name || 'Unknown User'}</p>
                                                <p className="text-xs text-stone-500">Reporter: {report.reporter?.name || 'Unknown User'}</p>
                                                <p className="text-xs text-stone-500">Reason: {report.reason || 'N/A'}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded">Pending</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                            <h3 className="font-bold text-stone-800">System Pulse</h3>
                        </div>
                        <div className="p-4 flex-1">
                            {recent_logs.length === 0 ? (
                                <p className="text-center text-sm text-stone-500 mt-4">No recent activity.</p>
                            ) : (
                                <div className="space-y-4">
                                    {recent_logs.map((log) => (
                                        <div key={log.id} className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-400" />
                                            <div>
                                                <p className="text-xs text-stone-600 line-clamp-2">{log.description}</p>
                                                <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                                                    {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}