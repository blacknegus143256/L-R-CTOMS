import React, { useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Orders({ auth, orders = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const executeSearch = () => {
        router.get(route('super.orders.index'), 
            { search: searchTerm, sort: sortBy, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') executeSearch();
    };

    const handleSort = (e) => {
        const newSort = e.target.value;
        setSortBy(newSort);
        router.get(route('super.orders.index'), 
            { search: searchTerm, sort: newSort, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true });
    };

    const getStatusBadgeColor = (status) => {
        const statusMap = {
            'pending': 'bg-amber-100 text-amber-700 border-amber-300',
            'confirmed': 'bg-blue-100 text-blue-700 border-blue-300',
            'in_progress': 'bg-indigo-100 text-indigo-700 border-indigo-300',
            'completed': 'bg-green-100 text-green-700 border-green-300',
            'cancelled': 'bg-red-100 text-red-700 border-red-300',
            'rework': 'bg-orange-100 text-orange-700 border-orange-300',
        };
        return statusMap[status] || 'bg-stone-100 text-stone-700 border-stone-300';
    };

    const highlightMatch = (text, term) => {
        if (!term) return text;
        const t = String(term).trim();
        if (t === '') return text;
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = String(text).split(new RegExp(`(${escaped})`, 'ig'));
        return parts.map((part, i) => {
            if (part.toLowerCase() === t.toLowerCase()) {
                return <span key={i} className="bg-amber-100 text-amber-800 px-1 rounded">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const ordersList = orders.data || [];

    return (
        <AuthenticatedLayout header={<h2 className="text-3xl font-bold text-stone-900">All Platform Orders</h2>}>
            <Head title="Platform Orders" />

            <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={executeSearch}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-700">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={handleSort}
                                className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="due-soon">Due Soon</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="price-low">Price: Low to High</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Orders Table */}
                {ordersList.length > 0 ? (
                    <div className="bg-white rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">Shop</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-stone-700 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-stone-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200">
                                    {ordersList.map((order) => (
                                        <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                                {highlightMatch(order.id, searchTerm)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-700">
                                                {highlightMatch(order.user?.name || order.customer?.name || 'Unknown', searchTerm)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-700">
                                                {order.tailoring_shop?.shop_name || 'Unknown Shop'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-700 truncate max-w-xs" title={order.order_services?.[0]?.service?.service_name || 'Custom Service'}>
                                                {order.order_services?.[0]?.service?.service_name || 'Custom Service'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(order.status)}`}>
                                                    {String(order.status).replace(/_/g, ' ').charAt(0).toUpperCase() + String(order.status).replace(/_/g, ' ').slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-right text-stone-900">
                                                ₱{(order.total_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link href={route('super.orders.show', order.id)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-12 border border-stone-200 shadow-sm text-center">
                        <p className="text-stone-500 text-lg font-medium">No orders found</p>
                    </div>
                )}

                {/* Pagination */}
                {orders.links && (
                    <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {orders.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                    } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
