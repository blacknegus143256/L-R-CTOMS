import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiUsers, FiArrowRight } from 'react-icons/fi';

export default function WelcomeToTeam({ message }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-black text-stone-900 tracking-tight">Staff Dashboard</h2>}>
            <Head title="Staff Dashboard" />

            <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center p-6">
                <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <FiUsers className="h-8 w-8" />
                    </div>
                    <h1 className="mt-5 text-3xl font-black text-stone-900">Welcome to the team!</h1>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                        {message || 'You currently are not assigned to any active tailor shops. Please wait for an invitation or contact your shop owner.'}
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800"
                        >
                            Go to home
                            <FiArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}