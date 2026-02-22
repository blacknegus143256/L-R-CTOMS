import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function ShopList({ auth, shops }) {
    const handleApprove = (id) => {
        if (confirm('Are you sure you want to approve this shop?')) {
            router.post(route('super.shops.approve', id));
        }
    };
    const handleReject = (id) => {
        if (confirm('Are you sure you want to reject this shop?')) {
            router.post(route('super.shops.reject', id));
        }
    };
    const handleDemote = (id) => {
        if (confirm('Are you sure you want to demote this shop to pending?')) {
            router.post(route('super.shops.demote', id));
        }
    };


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tailoring Shops Management</h2>}
        >
            <Head title="Shop List" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Tailoring Shops List</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shops && shops.map((shop) => (
                                    <tr key={shop.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.shop_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.contact_person}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shop.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                shop.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {shop.status === 'pending' && (
                                            <>      
                                            <button 
                                            onClick={() => handleApprove(shop.id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Approve</button>
                                            <button onClick={() => handleReject(shop.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Reject</button>
                                        </>
                                    )}
                                         {shop.status === 'approved' && (
                                            <button onClick={() => handleDemote(shop.id)} className='bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded'>Demote to Pending</button>
                                         )}   
                                         {shop.status === 'rejected' && (
                                            <button onClick={() => handleApprove(shop.id)} className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>Re-evaluate (Approve)</button>
                                         )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}