import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ auth, shop }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">
                {shop ? shop.shop_name : 'No Shop Assigned'}
            </h2>}
        >
            <Head title="Store Dashboard" />
            {/* ... rest of your code ... */}
        </AuthenticatedLayout>
    );
}