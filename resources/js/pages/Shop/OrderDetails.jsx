import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function OrderDetails() {
    const { order, staffMembers = [] } = usePage().props;

    const initialSelected = useMemo(
        () => (order?.assignments || []).map((member) => member.id),
        [order],
    );
    const [selected, setSelected] = useState(initialSelected);

    const saveAssignments = () => {
        router.put(route('shop.orders.assignees.attach', order.id), {
            assignee_ids: selected,
        }, {
            preserveScroll: true,
        });
    };

    const onSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
        setSelected(values);
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">Order #{order.id}</h1>
                    <p className="text-sm text-stone-500">Assignee and execution details</p>
                </div>
            }
        >
            <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-stone-800">Assignees</h2>
                    <p className="mt-1 text-sm text-stone-500">Select one or more staff members responsible for this order.</p>

                    <select
                        multiple
                        value={selected.map(String)}
                        onChange={onSelectChange}
                        className="mt-4 h-52 w-full rounded-xl border border-stone-300 p-3 text-sm"
                    >
                        {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={saveAssignments}
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Save Assignees
                    </button>

                    <div className="mt-6 border-t border-stone-100 pt-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Requested Materials</h3>
                        {(order.required_materials || []).length === 0 ? (
                            <p className="mt-2 text-sm text-stone-500">No specific materials listed.</p>
                        ) : (
                            <ul className="mt-2 space-y-1 text-sm text-stone-700">
                                {order.required_materials.map((material, idx) => (
                                    <li key={`${material}-${idx}`} className="rounded-lg bg-stone-50 px-3 py-2">{material}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-stone-800">Execution Snapshot</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-stone-500">Customer</dt>
                            <dd className="font-semibold text-stone-800">{order.customer?.name || order.user?.name || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Deadline</dt>
                            <dd className="font-semibold text-stone-800">{order.expected_completion_date || 'Not set'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Current Status</dt>
                            <dd className="font-semibold text-stone-800">{order.status || 'Pending'}</dd>
                        </div>
                    </dl>

                    <div className="mt-5 border-t border-stone-100 pt-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Measurements</h3>
                        {(order.measurements || []).length === 0 ? (
                            <p className="mt-2 text-sm text-stone-500">No measurements recorded yet.</p>
                        ) : (
                            <ul className="mt-2 space-y-1 text-sm text-stone-700">
                                {order.measurements.map((m) => (
                                    <li key={m.id} className="rounded-lg bg-stone-50 px-3 py-2">
                                        {m.measurement_name}: {m.value} {m.unit}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
