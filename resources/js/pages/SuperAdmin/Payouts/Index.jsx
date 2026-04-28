import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { confirmDialog } from '@/utils/dialog';

export default function PayoutsIndex({ auth, orders = [] }) {
    const { props } = usePage();
    const flashSuccess = props?.flash?.success;
    const flashError = props?.flash?.error;

    const handleRelease = async (order) => {
        const confirmed = await confirmDialog({
            title: 'Release Escrow Funds',
            message: `Mark escrow funds for Order #${order.id} as released?`,
            confirmText: 'Mark as Released',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (!confirmed) {
            return;
        }

        router.post(route('super.payouts.release', order.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Escrow Payouts</h2>}
        >
            <Head title="Escrow Payouts" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {(flashSuccess || flashError) && (
                        <div
                            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                                flashError
                                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                            role="status"
                            aria-live="polite"
                        >
                            {flashError || flashSuccess}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Payout Ledger</h3>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount in Escrow</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length > 0 ? (
                                        orders.map((order) => {
                                            const isReleased = order.payout_status === 'Released';

                                            return (
                                                <tr key={order.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 align-top">
                                                        <p className="font-semibold text-gray-900">{order.tailoring_shop?.shop_name || 'N/A'}</p>
                                                        <p className="mt-1 text-xs text-stone-500">
                                                            Pay now to: {order.tailoring_shop?.payout_info || 'No payout details provided. Please contact the shop.'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        ₱{Number(order.amount_paid || 0).toLocaleString('en-PH', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {isReleased ? (
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                Released
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {isReleased ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                                Disbursed
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRelease(order)}
                                                                className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                                            >
                                                                Mark as Released
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={5}>
                                                No completed or ready-for-pickup paid orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
