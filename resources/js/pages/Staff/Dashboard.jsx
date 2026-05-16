import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiCalendar, FiClock, FiShoppingCart, FiArrowRight, FiClipboard } from 'react-icons/fi';

export default function StaffDashboard() {
    const { props } = usePage();
    const shop = props.shop || null;
    const summary = props.summary || {};
    const orders = Array.isArray(props.orders) ? props.orders : [];

    const metrics = [
        {
            label: 'Active Assigned Orders',
            value: Number(summary.activeAssignedOrders ?? 0),
            icon: FiShoppingCart,
        },
        {
            label: 'Orders Due Soon',
            value: Number(summary.ordersDueSoon ?? 0),
            icon: FiClock,
        },
        {
            label: "Today's Appointments",
            value: Number(summary.todaysAppointments ?? 0),
            icon: FiCalendar,
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">Staff Dashboard</h2>
                    <p className="text-sm text-stone-500">{shop?.shop_name || 'Assigned shop workspace'}</p>
                </div>
            }
        >
            <Head title="Staff Dashboard" />

            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;

                        return (
                            <div key={metric.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-stone-400">{metric.label}</p>
                                        <p className="mt-3 text-4xl font-black text-stone-900">{metric.value}</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Link
                        href={route('staff.orders')}
                        className="group rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-900 to-stone-700 p-6 text-white shadow-xl transition hover:-translate-y-0.5"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-stone-300">Workspace</p>
                                <h3 className="mt-2 text-2xl font-black">Go to My Orders</h3>
                                <p className="mt-2 max-w-md text-sm text-stone-300">Open the assigned orders table to review work in progress, due dates, and order status.</p>
                            </div>
                            <FiArrowRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
                        </div>
                    </Link>

                    <Link
                        href={route('staff.appointments')}
                        className="group rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 text-stone-900 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Schedule</p>
                                <h3 className="mt-2 text-2xl font-black">View My Schedule</h3>
                                <p className="mt-2 max-w-md text-sm text-stone-600">See your assigned fittings and appointments in the shared calendar view.</p>
                            </div>
                            <FiArrowRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
                        </div>
                    </Link>
                </div>

                {orders.length === 0 && (
                    <div className="flex min-h-[18rem] items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-gradient-to-br from-white to-stone-50 p-6 shadow-sm">
                        <div className="w-full max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-lg">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <FiClipboard className="h-8 w-8" />
                            </div>
                            <h3 className="mt-5 text-2xl font-black text-stone-900">You're all caught up!</h3>
                            <p className="mt-3 text-sm leading-6 text-stone-600">
                                You have no active tasks right now. Wait for the shop owner to assign your next order.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
