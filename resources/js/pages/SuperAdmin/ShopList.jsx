import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { confirmDialog } from '@/utils/dialog';
import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

export default function ShopList({ auth, shops, stats = {}, filters = {} }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [docFilter, setDocFilter] = useState(filters.filter || 'all');
    const [reviewingDocument, setReviewingDocument] = useState(null);
    const [reviewStatus, setReviewStatus] = useState('approved');
    const [reviewReason, setReviewReason] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [rejectingShop, setRejectingShop] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionError, setRejectionError] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [notifyingShop, setNotifyingShop] = useState(null);
    const [resubmissionReason, setResubmissionReason] = useState('');
    const [resubmissionError, setResubmissionError] = useState('');
    const [isNotifying, setIsNotifying] = useState(false);

    useEffect(() => {
        setSearchTerm(filters.search || '');
        setDocFilter(filters.filter || 'all');
    }, [filters.search, filters.filter]);

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

    const reviewableDocuments = (shop) => ([
        {
            key: 'gov-id',
            label: 'Gov ID',
            fileKey: 'document_gov_id',
            statusKey: 'gov_id_status',
        },
        {
            key: 'bir',
            label: 'BIR 2303',
            fileKey: 'document_bir',
            statusKey: 'bir_2303_status',
        },
        {
            key: 'dti',
            label: 'DTI / Permit',
            fileKey: 'document_dti',
            statusKey: 'dti_permit_status',
        },
    ].map((document) => ({
        ...document,
        filePath: shop[document.fileKey],
        status: shop[document.statusKey] || 'pending',
    })));

    const openReviewModal = (shop, document) => {
        setReviewingDocument({ shop, document });
        setReviewStatus(document.status || 'approved');
        setReviewReason(shop.rejection_reason || '');
        setReviewError('');
    };

    const closeReviewModal = () => {
        setReviewingDocument(null);
        setReviewStatus('approved');
        setReviewReason('');
        setReviewError('');
    };

    const submitReview = (e) => {
        e.preventDefault();

        if (!reviewingDocument) {
            return;
        }

        setIsReviewing(true);
        setReviewError('');

        router.post(route('super.shops.review-document', reviewingDocument.shop.id), {
            document: reviewingDocument.document.key,
            status: reviewStatus,
            reason: reviewStatus === 'rejected' ? reviewReason : '',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                closeReviewModal();
            },
            onError: (errors) => {
                setReviewError(errors.reason || errors.status || 'Unable to update this document review.');
            },
            onFinish: () => {
                setIsReviewing(false);
            },
        });
    };

    const shopsData = shops?.data || [];
    const paginationLinks = shops?.links || [];

    const executeSearch = ({ search = searchTerm, filter = docFilter, page = 1 } = {}) => {
        router.get(route('super.shops.index'), {
            search,
            filter,
            page,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleFilterChange = (nextFilter) => {
        setDocFilter(nextFilter);
        executeSearch({ filter: nextFilter, page: 1 });
    };

    const handleSearchSubmit = (e) => {
        e?.preventDefault?.();
        executeSearch({ page: 1 });
    };

    const handlePaginationClick = (url) => {
        if (!url) {
            return;
        }

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleApprove = async (shop) => {
        const docsApproved =
            shop.gov_id_status === 'approved' &&
            shop.bir_2303_status === 'approved' &&
            shop.dti_permit_status === 'approved';

        if (!docsApproved) {
            await confirmDialog({
                title: 'Action Required',
                message: 'You cannot approve this shop yet. Please review and approve all three required legal documents (Gov ID, BIR 2303, DTI/Permit) first.',
                confirmText: 'Understood',
                cancelText: '',
                type: 'info',
            });
            return;
        }

        const confirmed = await confirmDialog({
            title: 'Approve Shop',
            message: 'Are you sure you want to approve this shop?',
            confirmText: 'Approve',
            cancelText: 'Cancel',
            type: 'success',
        });

        if (confirmed) {
            router.post(route('super.shops.approve', shop.id));
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

    const openNotifyResubmissionModal = (shop) => {
        setNotifyingShop(shop);
        setResubmissionReason('');
        setResubmissionError('');
    };

    const closeNotifyResubmissionModal = () => {
        setNotifyingShop(null);
        setResubmissionReason('');
        setResubmissionError('');
    };

    const submitNotifyResubmission = (e) => {
        e.preventDefault();

        if (!notifyingShop) {
            return;
        }

        if (!resubmissionReason.trim()) {
            setResubmissionError('Please provide details about what needs to be resubmitted.');
            return;
        }

        setIsNotifying(true);
        setResubmissionError('');

        router.post(route('super.shops.notify-resubmission', notifyingShop.id), { reason: resubmissionReason }, {
            preserveScroll: true,
            onSuccess: () => {
                closeNotifyResubmissionModal();
            },
            onError: (errors) => {
                setResubmissionError(errors.reason || 'Unable to send resubmission notification.');
            },
            onFinish: () => {
                setIsNotifying(false);
            },
        });
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

                        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchSubmit(e);
                                            }
                                        }}
                                        placeholder="Search by shop name, owner name, or email"
                                        className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-stone-800 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-800"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleFilterChange('all')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                            >
                                All ({stats.all ?? 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('complete')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'complete' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                            >
                                Docs Complete ({stats.complete ?? 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('missing')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${docFilter === 'missing' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                            >
                                Docs Missing ({stats.missing ?? 0})
                            </button>
                            </div>
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
                                {shopsData.map((shop) => {
                                    // Safely extract and lowercase the status to prevent case-sensitivity bugs
                                    const shopStatus = (shop.status?.name || shop.status || '').toString().toLowerCase();
                                    
                                    return (
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
                                                {reviewableDocuments(shop).map((document) => (
                                                    <div key={document.key} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                {document.filePath ? (
                                                                    <a className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline" href={route('super.shops.document', { shop: shop.id, type: document.key })} target="_blank" rel="noopener noreferrer">
                                                                        {document.label}
                                                                    </a>
                                                                ) : (
                                                                    <span className="font-semibold text-stone-400">{document.label} Missing</span>
                                                                )}
                                                                <div className="mt-1">
                                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${document.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : document.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                        {document.status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {document.filePath && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openReviewModal(shop, document)}
                                                                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
                                                                >
                                                                    Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shopStatus === 'approved' ? 'bg-green-100 text-green-800' : 
                                                shopStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {shopStatus.charAt(0).toUpperCase() + shopStatus.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {shopStatus === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(shop)}
                                                            className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openNotifyResubmissionModal(shop)}
                                                            className="inline-flex items-center justify-center rounded bg-amber-600 px-3 py-2 font-bold text-white hover:bg-amber-700"
                                                        >
                                                            Request Resubmission
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(shop)}
                                                            className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-700"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {shopStatus === 'approved' && (
                                                    <button
                                                        onClick={() => handleDemote(shop.id)}
                                                        className="inline-flex items-center justify-center rounded bg-orange-500 px-3 py-2 font-bold text-white hover:bg-orange-700"
                                                    >
                                                        Demote to Pending
                                                    </button>
                                                )}
                                                {shopStatus === 'rejected' && (
                                                    <button
                                                        onClick={() => handleApprove(shop)}
                                                        className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-2 font-bold text-white hover:bg-green-700"
                                                    >
                                                        Re-evaluate (Approve)
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {shopsData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm font-medium text-stone-500">
                                            No shops match the current search or document filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>

                        {paginationLinks.length > 3 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {paginationLinks.map((link, index) => {
                                    const isDisabled = !link.url;

                                    return (
                                        <button
                                            key={`${link.label}-${index}`}
                                            type="button"
                                            onClick={() => handlePaginationClick(link.url)}
                                            disabled={isDisabled}
                                            className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                                                link.active
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                                            } ${isDisabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        <Modal show={!!reviewingDocument} maxWidth="lg" onClose={closeReviewModal}>
                            <form onSubmit={submitReview} className="p-6">
                                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-stone-900">Review Document</h3>
                                        <p className="mt-1 text-sm text-stone-600">
                                            Update the document status and add a reason if it needs correction.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeReviewModal}
                                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4">
                                    <div>
                                        <label htmlFor="document_status" className="mb-2 block text-sm font-bold text-stone-700">
                                            Review Status
                                        </label>
                                        <select
                                            id="document_status"
                                            value={reviewStatus}
                                            onChange={(e) => setReviewStatus(e.target.value)}
                                            className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="rejection_reason" className="mb-2 block text-sm font-bold text-stone-700">
                                            Rejection Reason
                                        </label>
                                        <textarea
                                            id="rejection_reason"
                                            rows={5}
                                            value={reviewReason}
                                            onChange={(e) => setReviewReason(e.target.value)}
                                            disabled={reviewStatus !== 'rejected'}
                                            placeholder="BIR document is expired"
                                            className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:bg-stone-100"
                                        />
                                    </div>

                                    {reviewError && <p className="text-xs font-semibold text-rose-600">{reviewError}</p>}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeReviewModal}
                                        className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-stone-700 hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isReviewing}
                                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isReviewing ? 'Submitting...' : 'Save Review'}
                                    </button>
                                </div>
                            </form>
                        </Modal>

                        <Modal show={!!rejectingShop} maxWidth="lg" onClose={closeRejectModal}>
                            <form onSubmit={submitReject} className="p-6">
                                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-stone-900">Reject Shop</h3>
                                        <p className="mt-1 text-sm text-stone-600">
                                            Provide a reason for rejecting this shop application.
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

                                <div className="mt-5 grid gap-4">
                                    <div>
                                        <label htmlFor="reject_reason" className="mb-2 block text-sm font-bold text-stone-700">
                                            Rejection Reason
                                        </label>
                                        <textarea
                                            id="reject_reason"
                                            rows={5}
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Please provide a detailed reason for rejection..."
                                            className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                                        />
                                    </div>

                                    {rejectionError && <p className="text-xs font-semibold text-rose-600">{rejectionError}</p>}
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
                                        {isRejecting ? 'Rejecting...' : 'Reject Shop'}
                                    </button>
                                </div>
                            </form>
                        </Modal>

                        <Modal show={!!notifyingShop} maxWidth="lg" onClose={closeNotifyResubmissionModal}>
                            <form onSubmit={submitNotifyResubmission} className="p-6">
                                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-stone-900">Request Document Resubmission</h3>
                                        <p className="mt-1 text-sm text-stone-600">
                                            Notify the shop owner about documents that need to be resubmitted or corrected.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeNotifyResubmissionModal}
                                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4">
                                    <div>
                                        <label htmlFor="resubmit_reason" className="mb-2 block text-sm font-bold text-stone-700">
                                            Details for Resubmission
                                        </label>
                                        <textarea
                                            id="resubmit_reason"
                                            rows={5}
                                            value={resubmissionReason}
                                            onChange={(e) => setResubmissionReason(e.target.value)}
                                            placeholder="e.g., DTI permit needs to be renewed, Gov ID photo quality is too low..."
                                            className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                                        />
                                    </div>

                                    {resubmissionError && <p className="text-xs font-semibold text-rose-600">{resubmissionError}</p>}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeNotifyResubmissionModal}
                                        className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-stone-700 hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isNotifying}
                                        className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isNotifying ? 'Sending...' : 'Send Resubmission Request'}
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