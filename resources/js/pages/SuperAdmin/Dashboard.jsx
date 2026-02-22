import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function Dashboard({ auth, stats }) {
    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="...">Dashboard Summary</h2>}>
            <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
                <div className="bg-white p-6 shadow rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 uppercase">Total Shops</p>
                    <p className="text-2xl font-bold">{stats.total_shops}</p>
                </div>
                {/* Add more cards for total_users and pending_shops here */}
            </div>
        </AuthenticatedLayout>
    );
}