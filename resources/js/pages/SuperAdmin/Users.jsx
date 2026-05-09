import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import ImpersonateButton from '@/Components/ImpersonateButton';
import { confirmDialog } from '@/utils/dialog';

// Accept the new paginated 'users' object and 'filters' from the backend
export default function Users({ auth, users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    // Debounce the search so it doesn't hit the server on every keystroke
    const debouncedSearch = useCallback(
        debounce((query) => {
            router.get(route('super.users.index'), { search: query }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300),
        []
    );

    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, [debouncedSearch]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleToggleStatus = async (user) => {
        const isSuspending = user.status === 'active';
        const confirmed = await confirmDialog({
            title: isSuspending ? 'Suspend User?' : 'Reactivate User?',
            message: isSuspending 
                ? `Are you sure you want to suspend ${user.name}? They will be unable to log in.`
                : `Are you sure you want to reactivate ${user.name}? They will regain access to their account.`,
            confirmText: isSuspending ? 'Yes, Suspend' : 'Yes, Reactivate',
            cancelText: 'Cancel',
            type: isSuspending ? 'error' : 'success',
        });

        if (confirmed) {
            router.patch(route('super.users.toggle-status', user.id), {}, { preserveScroll: true });
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDialog({
            title: 'Delete User',
            message: 'Are you sure you want to delete this user?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'error',
        });

        if (confirmed) {
            router.delete(`/super-admin/users/${id}`);
        }
    };

    return (
        <AuthenticatedLayout 
            user={auth.user} 
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">User Management</h2>}
        >
            <Head title="User Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Registered Users</h3>
                            <div className="relative w-72">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search name or email..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-xl leading-5 bg-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                                />
                            </div>
                        </div>
                        
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-stone-500 uppercase tracking-wider">Date Registered</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users && users.data && users.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 
                                                user.role === 'store_admin' ? 'bg-blue-100 text-blue-800' : 
                                                'bg-gray-100 text-gray-800'}`}>
                                                {user.role.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                                    (!user.status || user.status === 'active') 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {(!user.status || user.status === 'active') ? '● Active' : '○ Suspended'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-medium">
                                            {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                                            {auth.user.id !== user.id && user.role !== 'super_admin' && (
                                                <div>
                                                    <ImpersonateButton targetUserId={user.id} targetUserRole={user.role} />
                                                </div>
                                            )}
                                            
                                            {user.id !== auth.user.id ? (
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-colors shadow-sm ${
                                                        (!user.status || user.status === 'active')
                                                            ? 'bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    }`}
                                                >
                                                    {(!user.status || user.status === 'active') ? 'Suspend Account' : 'Reactivate Account'}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 italic">Current User</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-black text-stone-800 mb-1">No users found</h3>
                                                <p className="text-sm text-stone-500 font-medium">
                                                    {searchTerm ? `We couldn't find anyone matching "${searchTerm}".` : 'There are no users to display yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {/* Pagination / Summary */}
                        {users && users.links && (
                            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
                                <div className="text-sm text-stone-600 font-medium">
                                    Showing <span className="font-bold text-stone-900">{users.from || 0}</span> to <span className="font-bold text-stone-900">{users.to || 0}</span> of <span className="font-bold text-stone-900">{users.total}</span> users
                                </div>
                                <div className="flex gap-2">
                                    {users.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                                            disabled={!link.url}
                                            className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                    : link.url
                                                        ? 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                                        : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}