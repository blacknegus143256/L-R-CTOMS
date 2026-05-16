import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function StaffManagement() {
    const { shop, staff = [] } = usePage().props;
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [email, setEmail] = useState('');

    const { activeStaff, inactiveStaff } = useMemo(() => {
        const active = [];
        const inactive = [];

        staff.forEach((member) => {
            if (member?.pivot?.is_active) {
                active.push(member);
            } else {
                inactive.push(member);
            }
        });

        return { activeStaff: active, inactiveStaff: inactive };
    }, [staff]);

    const submitInvite = (e) => {
        e.preventDefault();
        router.post(route('shop.staff.invite'), { email }, {
            preserveScroll: true,
            onSuccess: () => {
                setEmail('');
                setShowInviteModal(false);
            },
        });
    };

    const toggleMember = (member) => {
        router.patch(route('shop.staff.toggle', member.id), {
            is_active: !Boolean(member?.pivot?.is_active),
        }, {
            preserveScroll: true,
        });
    };

    const removeMember = (member) => {
        if (!window.confirm(`Remove ${member.name} from this shop?`)) {
            return;
        }

        router.delete(route('shop.staff.destroy', member.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Staff Management</h1>
                        <p className="text-sm text-stone-500">{shop?.shop_name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowInviteModal(true)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Invite Staff
                    </button>
                </div>
            }
        >
            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="border-b border-stone-200 px-5 py-4">
                        <h2 className="text-lg font-bold text-stone-800">Active Staff</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {activeStaff.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-stone-500" colSpan={5}>No active staff members.</td>
                                    </tr>
                                ) : activeStaff.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-stone-800">{member.name}</td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{member.email}</td>
                                        <td className="px-4 py-3 text-sm text-stone-600 capitalize">{member.role}</td>
                                        <td className="px-4 py-3">
                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-stone-300 text-indigo-600"
                                                    checked={Boolean(member?.pivot?.is_active)}
                                                    onChange={() => toggleMember(member)}
                                                />
                                                <span className="text-xs font-semibold text-emerald-700">Active</span>
                                            </label>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeMember(member)}
                                                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="border-b border-stone-200 px-5 py-4">
                        <h2 className="text-lg font-bold text-stone-800">Inactive Staff</h2>
                    </div>
                    <div className="divide-y divide-stone-100">
                        {inactiveStaff.length === 0 ? (
                            <p className="px-5 py-4 text-sm text-stone-500">No inactive staff members.</p>
                        ) : inactiveStaff.map((member) => (
                            <div key={member.id} className="flex items-center justify-between px-5 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-700">{member.name}</p>
                                    <p className="text-xs text-stone-500">{member.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleMember(member)}
                                    className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                                >
                                    Reactivate
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
                    <form onSubmit={submitInvite} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-stone-800">Invite Staff by Email</h3>
                        <p className="mt-1 text-sm text-stone-500">Existing users will be added to this shop as staff.</p>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-4 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                            placeholder="staff@example.com"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowInviteModal(false)}
                                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Send Invite
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
