import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

export default function AccessRevoked() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-black text-stone-900 tracking-tight">Access Revoked</h2>}
        >
            <Head title="Access Revoked" />

            <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
                <div className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <FiAlertTriangle className="h-8 w-8" />
                    </div>
                    <h1 className="mt-5 text-3xl font-black text-stone-900">Access revoked</h1>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                        Your staff access has been disabled for this shop. If this looks wrong, contact the shop owner to restore your assignment.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800"
                        >
                            <FiArrowLeft className="h-4 w-4" />
                            Go back
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}