import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { confirmDialog } from '@/utils/dialog';
import { useMemo, useState } from 'react';

export default function ShopList({ auth, shops }) {
    const [docFilter, setDocFilter] = useState('all');
    const [rejectingShop, setRejectingShop] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionError, setRejectionError] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const formatTextLines = (text, wordsPerLine = 4) => {
        if (!text || text === 'N/A') return <span className="text-stone-400 italic">N/A</span>;

        const words = String(text).split(' ');
        const lines = [];

        for (let i = 0; i < words.length; i += wordsPerLine) {
            lines.push(words.slice(i, i + wordsPerLine).join(' '));
        }

        return (
            <div className="flex flex-col gap-0.5">
                {lines.map((line, idx) => (
                    <span key={idx} className="block">{line}</span>
                ))}
            </div>
        );
    };

    const hasCompleteDocs = (shop) => {
        return !!shop.document_gov_id && !!shop.document_bir && !!shop.document_dti;
    };

    const counts = useMemo(() => {
        const all = shops?.length || 0;
        const complete = (shops || []).filter(hasCompleteDocs).length;
        const missing = all - complete;

        return { all, complete, missing };
    }, [shops]);

    const filteredShops = useMemo(() => {
        if (docFilter === 'complete') {
            return (shops || []).filter(hasCompleteDocs);
        }

        if (docFilter === 'missing') {
            return (shops || []).filter((shop) => !hasCompleteDocs(shop));
        }

        return shops || [];
    }, [docFilter, shops]);

    const handleApprove = async (id) => {
        const confirmed = await confirmDialog({
            title: 'Approve Shop',
            message: 'Are you sure you want to approve this shop?',
            confirmText: 'Approve',
            cancelText: 'Cancel',
            type: 'success',
        });

        if (confirmed) {
            router.post(route('super.shops.approve', id));
        }
    };
    const openRejectModal = (shop) => {
        setRejectingShop(shop);
        setRejectionReason('');
        setRejectionError('');
    };
    const closeRejectModal = () => {
        setRejectingShop(null);
        setRejectionReason('');
        setRejectionError('');
    };
    const submitReject = (e) => {
        e.preventDefault();

        if (!rejectingShop) {
            return;
        }

        setIsRejecting(true);
        setRejectionError('');

        router.post(route('super.shops.reject', rejectingShop.id), { reason: rejectionReason }, {
            preserveScroll: true,
            onSuccess: () => {
                closeRejectModal();
            },
            onError: (errors) => {
                setRejectionError(errors.reason || 'Unable to reject this shop.');
            },
            onFinish: () => {
                setIsRejecting(false);
            },
        });
    };
    const handleDemote = async (id) => {
        const confirmed = await confirmDialog({
            title: 'Demote Shop',
            message: 'Are you sure you want to demote this shop to pending?',
            confirmText: 'Demote',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (confirmed) {
            router.post(route('super.shops.demote', id));
        }
    };


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tailoring Shops and Legal Document Review</h2>}
        >
            <Head title="Shop List" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Tailoring Shops List</h3>

                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setDocFilter('all')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                            >
                                All ({counts.all})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocFilter('complete')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'complete' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                            >
                                Docs Complete ({counts.complete})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocFilter('missing')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'missing' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                            >
                                Docs Missing ({counts.missing})
                            </button>
                        </div>

                        <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terms Accepted</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredShops.map((shop) => (
                                    <tr key={shop.id}>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{shop.shop_name}</td>
                                        <td className="px-3 py-3 text-sm text-gray-500 max-w-xs align-top">
                                            <div className="font-semibold text-gray-900 leading-tight">{formatTextLines(shop?.user?.name || shop.contact_person || 'N/A', 4)}</div>
                                            <div className="text-xs text-gray-500 truncate mt-1">{shop?.user?.email || 'No email'}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs align-top">
                                            {formatTextLines(
                                                shop?.user?.profile?.street || shop?.user?.profile?.barangay
                                                    ? `${shop?.user?.profile?.street || ''}${shop?.user?.profile?.street && shop?.user?.profile?.barangay ? ', ' : ''}${shop?.user?.profile?.barangay || ''}`
                                                    : 'N/A',
                                                4,
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col gap-1">
                                                {shop.document_gov_id ? (
                                                    <a className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold" href={route('super.shops.document', { shop: shop.id, type: 'gov-id' })} target="_blank" rel="noopener noreferrer">Gov ID</a>
                                                ) : <span className="text-gray-400">Gov ID Missing</span>}
                                                {shop.document_bir ? (
                                                    <a className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold" href={route('super.shops.document', { shop: shop.id, type: 'bir' })} target="_blank" rel="noopener noreferrer">BIR 2303</a>
                                                ) : <span className="text-gray-400">BIR Missing</span>}
                                                {shop.document_dti ? (
                                                    <a className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold" href={route('super.shops.document', { shop: shop.id, type: 'dti' })} target="_blank" rel="noopener noreferrer">DTI / Permit</a>
                                                ) : <span className="text-gray-400">DTI Missing</span>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 align-top">
                                            {shop.terms_accepted_at ? (
                                                <div className="flex flex-col text-sm text-stone-600">
                                                    <span className="font-bold text-stone-900">
                                                        {new Date(shop.terms_accepted_at).toLocaleDateString()}
                                                    </span>
                                                    <hr className="my-1.5 w-8 border-stone-300" />
                                                    <span className="text-xs font-medium text-stone-500">
                                                        {new Date(shop.terms_accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-stone-400 italic">Not accepted</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shop.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                shop.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {shop.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(shop.id)}
                                                            className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(shop)}
                                                            className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-700"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {shop.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleDemote(shop.id)}
                                                        className="inline-flex items-center justify-center rounded bg-orange-500 px-3 py-2 font-bold text-white hover:bg-orange-700"
                                                    >
                                                        Demote to Pending
                                                    </button>
                                                )}
                                                {shop.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleApprove(shop.id)}
                                                        className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-2 font-bold text-white hover:bg-green-700"
                                                    >
                                                        Re-evaluate (Approve)
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredShops.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm font-medium text-stone-500">
                                            No shops match this document filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>

                        <Modal show={!!rejectingShop} maxWidth="lg" onClose={closeRejectModal}>
                            <form onSubmit={submitReject} className="p-6">
                                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-stone-900">Reject Shop</h3>
                                        <p className="mt-1 text-sm text-stone-600">
                                            Add a clear reason so the shop owner knows what to fix.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeRejectModal}
                                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-5">
                                    <label htmlFor="rejection_reason" className="mb-2 block text-sm font-bold text-stone-700">
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        id="rejection_reason"
                                        rows={5}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="BIR document is expired"
                                        className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                                    />
                                    {rejectionError && <p className="mt-2 text-xs font-semibold text-rose-600">{rejectionError}</p>}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeRejectModal}
                                        className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-stone-700 hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isRejecting}
                                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isRejecting ? 'Submitting...' : 'Reject Shop'}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}