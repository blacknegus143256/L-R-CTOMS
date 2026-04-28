import React, { useEffect, useRef, useState } from 'react';
import AlertModal from '@/Components/AlertModal.jsx';
import { buildMapUrl } from '@/utils/map';
import { showAlert } from '@/utils/alert';
import { confirmDialog, promptDialog } from '@/utils/dialog';
import { getNormalizedStatusLabel, getPaymentDisplayData, getTailorActionFlags } from '@/utils/orderActionRules';
import TailorOverview from './TailorOrderComponents/TailorOverview.jsx';
import TailorQuoteBuilder from './TailorOrderComponents/TailorQuoteBuilder.jsx';
import TailorShowcase from './TailorOrderComponents/TailorShowcase.jsx';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Ruler, Camera, ClipboardList, AlertCircle, MapPin, Phone, Download, Maximize2, X } from 'lucide-react';
import { FiLock } from 'react-icons/fi';
import { TbCurrencyPeso } from 'react-icons/tb';
import { router, usePage } from '@inertiajs/react';

export default function TailorOrderWorkspace({ auth, order }) {
    const { props, url } = usePage();
    const parsedUrl = new URL(url, 'http://localhost');
    const requestedTab = (parsedUrl.searchParams.get('tab') || '').trim().toLowerCase();
    const highlightFromQuery = parsedUrl.searchParams.get('highlight');
    const highlightFromHash = parsedUrl.hash ? parsedUrl.hash.replace('#', '') : null;
    const highlightSection = (highlightFromQuery || highlightFromHash || '').trim().toLowerCase();
    const validHighlights = ['measurements', 'quote', 'showcase', 'status', 'rework', 'timeline'];
    const currentOrder = order || {};
    const actionFlags = getTailorActionFlags(currentOrder);
    const paymentDisplay = getPaymentDisplayData(currentOrder);
    const paymentStatus = paymentDisplay.paymentStatus;
    const isPaymentVerified = paymentDisplay.isVerified;
    const statusLabel = getNormalizedStatusLabel(currentOrder.status);
    
    // Safe status normalization for Mark Ready button
    const rawStatus = actionFlags.rawStatus;
    const reworkRequest = currentOrder?.rework_request;
    const reworkRequests = Array.isArray(currentOrder?.rework_requests)
        ? currentOrder.rework_requests
        : reworkRequest
            ? [reworkRequest]
            : [];
    const hasActiveReworkStatus = reworkRequests.some((item) => {
        const status = String(item?.status || '').trim().toLowerCase();
        return status === 'pending' || status === 'pending review';
    });
    const reworkStatus = (reworkRequest?.status || '').toString();
    const canAccessShowcase = ['confirmed', 'appointment scheduled', 'in progress', 'ready for pickup', 'completed'].includes(rawStatus);
    const hasFinishedLook = (currentOrder.images || []).length > 0;
    const canMarkAsCompleted = ['in progress', 'ready for production'].includes(rawStatus);
    
    const shopFromProps = props.shop || props.auth?.shop;
    const shopFromOrder = currentOrder?.tailoringShop || currentOrder?.shop;
    const shop = shopFromProps?.attributes ? shopFromProps : (shopFromOrder?.attributes ? shopFromOrder : (shopFromProps || shopFromOrder || {}));
    const availableShopAttributes = shop.attributes || [];
    const orderLogs = Array.isArray(currentOrder.logs) ? currentOrder.logs : [];
    const categories = Array.isArray(props?.categories) ? props.categories : [];

    const formatTimelineDate = (value) => {
        if (!value) return 'Unknown date';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Unknown date';

        return date.toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };
    const [activeTab, setActiveTab] = useState('overview');
    const [activeHighlight, setActiveHighlight] = useState(null);
    const measurementsRef = useRef(null);
    const quoteRef = useRef(null);
    const statusRef = useRef(null);
    const showcaseRef = useRef(null);
    const reworkRef = useRef(null);

const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);

    const manualProofPath = currentOrder?.manual_payment_proof_path || null;
    const manualProofUrl = manualProofPath
        ? (manualProofPath.startsWith('http') ? manualProofPath : `/storage/${manualProofPath}`)
        : null;
    const manualReferenceId = currentOrder?.manual_payment_reference_id || '';
    const hasManualPaymentProof = Boolean(manualProofUrl || manualReferenceId);

    useEffect(() => {
        if (!isProofViewerOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsProofViewerOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isProofViewerOpen]);

    useEffect(() => {
        if (requestedTab === 'rework') {
            setActiveTab('rework');
            setActiveHighlight('rework');
            return;
        }

        if (!validHighlights.includes(highlightSection)) return;

        const tabMap = {
            measurements: 'measurements & quote',
            quote: 'measurements & quote',
            showcase: 'showcase',
            status: 'overview',
            rework: 'rework',
            timeline: 'timeline',
        };

        setActiveTab(tabMap[highlightSection] || 'overview');
        setActiveHighlight(highlightSection);
    }, [highlightSection, requestedTab]);

    useEffect(() => {
        if (!validHighlights.includes(activeHighlight)) return;

        const refMap = {
            measurements: measurementsRef,
            quote: quoteRef,
            status: statusRef,
            showcase: showcaseRef,
            rework: reworkRef,
        };

        const targetRef = refMap[activeHighlight];

        if (activeHighlight === 'measurements') {
            const measurementAnchor = document.getElementById('measurements');
            if (measurementAnchor) {
                measurementAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                measurementAnchor.focus();
                window.history.replaceState({}, '', window.location.pathname);
                const timer = setTimeout(() => {
                    setActiveHighlight(null);
                }, 3000);
                return () => {
                    clearTimeout(timer);
                };
            }
        }

        if (targetRef?.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetRef.current.focus();
        }

        window.history.replaceState({}, '', window.location.pathname);

        const timer = setTimeout(() => {
            setActiveHighlight(null);
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, [activeTab, activeHighlight]);

    // --- QUOTING & MEASUREMENT STATE ---
    const [laborPrice, setLaborPrice] = useState(currentOrder.service?.price || 0);
    const [rushFee, setRushFee] = useState(Number(currentOrder?.rush_fee || 0));
    const [productionMinDays, setProductionMinDays] = useState(currentOrder?.production_min_days ?? '');
    const [productionMaxDays, setProductionMaxDays] = useState(currentOrder?.production_max_days ?? '');
const [measurementFields, setMeasurementFields] = useState(() => {
    // Map over requested fields, and inject the customer's submitted values if they exist
    const submittedMap = currentOrder.measurement_snapshot?.submitted || {};
    const initialMeasurementFields = (currentOrder.measurement_snapshot?.requested || []).map(req => ({
        ...req,
        // Safely check the 'submitted' object for a matching name and inject its value
        value: submittedMap[req.name] ?? req.value ?? ''
    }));
    return initialMeasurementFields;
});
    const [measurementUnit, setMeasurementUnit] = useState('inches');
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [isSubmittingMeasurements, setIsSubmittingMeasurements] = useState(false);
    const [measurementSuccess, setMeasurementSuccess] = useState(false);
    
    const isQuoteLocked = ['quoted', 'confirmed', 'ready for production', 'in progress', 'appointment scheduled', 'in production', 'ready for pickup', 'completed', 'rejected', 'declined', 'cancelled'].includes(rawStatus);
    const measurementType = (currentOrder.measurement_type || '').toString().trim().toLowerCase();
    const isCustomerMeasurementFlow = ['profile', 'self_measured'].includes(measurementType);
    const isInShopMeasurementFlow = ['scheduled', 'workshop_fitting'].includes(measurementType);
    const isFinalOrderState = ['completed', 'rejected', 'declined', 'cancelled'].includes(rawStatus);
    const hasRequestedMeasurements = Array.isArray(currentOrder.measurement_snapshot?.requested) && currentOrder.measurement_snapshot.requested.length > 0;
    const hasSubmittedMeasurements = !!currentOrder.measurement_snapshot?.submitted && Object.keys(currentOrder.measurement_snapshot.submitted).length > 0;
    const hasRecordedMeasurementsForQuote = Boolean(currentOrder?.measurements_taken) || hasSubmittedMeasurements;
    const requiresMeasurementBeforeQuote = measurementType !== 'none';
    const isMeasurementLocked = isCustomerMeasurementFlow
        ? hasRequestedMeasurements || hasSubmittedMeasurements
        : isInShopMeasurementFlow
            ? isFinalOrderState
            : false;

    // --- DYNAMIC MATERIALS STATE ---
    const isCustomerProvided = currentOrder.material_source === 'customer';
    const [tailorMaterials, setTailorMaterials] = useState(currentOrder.required_materials || []);

    const addMaterial = () => {
        setTailorMaterials([...tailorMaterials, { name: '', quantity: 1, unit: 'meters', price: 0 }]);
    };

    const removeMaterial = (index) => {
        setTailorMaterials(tailorMaterials.filter((_, i) => i !== index));
    };

    const updateMaterial = (index, field, value) => {
        const newMaterials = [...tailorMaterials];
        newMaterials[index][field] = value;
        setTailorMaterials(newMaterials);
    };

    const tailorMaterialsTotal = isCustomerProvided ? 0 : tailorMaterials.reduce((sum, mat) => sum + (Number(mat.price || 0) * Number(mat.quantity || 1)), 0);
    const itemsTotal = currentOrder.items ? currentOrder.items.reduce((sum, item) => {
      const price = Number(item.price || item.pivot?.price || 0);
      const qty = Number(item.quantity || item.pivot?.quantity || 1);
      return sum + (price * qty);
    }, 0) : 0;
    const totalQuote = Number(laborPrice || 0) + tailorMaterialsTotal + itemsTotal + Number(rushFee || 0);

    const handleReject = (e) => {
        e.preventDefault();
        router.post(route('orders.reject-payment', currentOrder.id), {
            reason: rejectReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['order'] });
                setShowRejectModal(false);
                setRejectReason('');
            },
        });
    };

const handleSendMeasurements = (e) => {
    if (e) e.preventDefault(); // Stop any default browser behavior
    
    const requestedArr = measurementFields.filter(m => m.name.trim() !== '');
        if (isCustomerMeasurementFlow && requestedArr.length === 0) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Please add at least one measurement part, or change the fit method.', type: 'error' });
            return;
        }

    if (!measurementFields || measurementFields.length === 0) {
        setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Please add at least one measurement.', type: 'error' });
        return;
    }

    const hasEmpty = measurementFields.some(f => !f.name?.trim());

    if (hasEmpty) {
        setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'All measurement fields must have a name.', type: 'error' });
        return;
    }

    // Explicitly use router.patch, NOT router.get or router.post
    router.patch(`/store/orders/${currentOrder.id}/request-measurements`, {
        measurement_fields: measurementFields,
        measurement_unit: measurementUnit,
        requested_measurements: requestedArr,
    }, {
        preserveScroll: true,
        onStart: () => setIsSubmittingMeasurements(true),
        onFinish: () => setIsSubmittingMeasurements(false),
        onSuccess: () => {
            setMeasurementSuccess(true);
            setTimeout(() => setMeasurementSuccess(false), 3000);
        }
    });
};

    const handleSendQuote = async () => {
        if (requiresMeasurementBeforeQuote && !hasRecordedMeasurementsForQuote && !hasRequestedMeasurements) {
            setAlertConfig({
                isOpen: true,
                title: 'Missing Measurements',
                message: 'You must either record the customer\'s measurements or send them a measurement request before issuing a financial quote.',
                type: 'warning'
            });
            return;
        }

        const requestedMeasurements = measurementFields
            .filter(m => m.name?.trim() !== '')
            .map(m => ({
                name: m.name.trim(),
                instruction: (m.instruction || '').trim(),
            }));

        if (
            (order.measurement_type === 'profile' || order.measurement_type === 'self_measured')
            && (!requestedMeasurements || requestedMeasurements.length === 0)
        ) {
            return setAlertConfig({
                isOpen: true,
                title: 'Action Required',
                message: 'You must request specific measurements from the customer before submitting a quote for a remote fitting.',
                type: 'error'
            });
        }

        if (!productionMinDays || !productionMaxDays) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Please enter the estimated production time range in working days before sending the quote.', type: 'error' });
            return;
        }

        if (Number(productionMinDays) < 1 || Number(productionMaxDays) < Number(productionMinDays)) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Production day range is invalid. Ensure min is at least 1 and max is greater than or equal to min.', type: 'error' });
            return;
        }

        const validTailorMaterials = tailorMaterials.filter(m => m.name.trim() !== '');
        if (validTailorMaterials.length === 0) {
            const confirmed = await confirmDialog({
                title: 'Send Quote Without Materials',
                message: 'You have not specified any required materials. Send quote anyway?',
                confirmText: 'Send Quote',
                cancelText: 'Cancel',
                type: 'info',
            });

            if (!confirmed) {
                return;
            }
        }

        setIsSubmittingQuote(true);
        router.patch(route('store.orders.quote', currentOrder.id), {
            base_labor: laborPrice,
            rush_fee: currentOrder?.rush_order ? Number(rushFee || 0) : 0,
            production_min_days: Number(productionMinDays),
            production_max_days: Number(productionMaxDays),
            
            required_materials: validTailorMaterials,
            material_source: currentOrder.material_source,
            status: 'Quoted'
        }, {
            onSuccess: () => {
                setIsSubmittingQuote(false);
                setAlertConfig({ isOpen: true, title: 'Success', message: 'Quote & Requirements sent successfully!', type: 'success' });
            },
            onError: () => setIsSubmittingQuote(false),
            preserveScroll: true
        });
    };
    const orderOwner = currentOrder.customer || currentOrder.user || {};
    const handleAccept = () => {
        setActiveTab('measurements & quote');
    };

    const handleMarkReady = async () => {
        if (!hasFinishedLook) {
            const proceedWithoutPhoto = await confirmDialog({
                title: 'No Finished Look Photo',
                message: 'Are you sure you want to mark this order as ready without a finished look photo? Uploading one is optional, but it helps the customer preview the final product.',
                confirmText: 'Yes, Mark Ready',
                cancelText: 'Add Photo First',
                type: 'warning',
            });

            if (!proceedWithoutPhoto) {
                return;
            }
        }

        const confirmed = await confirmDialog({
            title: 'Mark Order Ready',
            message: 'Mark this order as ready for pickup?',
            confirmText: 'Mark Ready',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (confirmed) {
            router.patch(`/store/orders/${currentOrder.id}/status`, { status: 'Ready for Pickup' }, {
                preserveScroll: true
            });
        }
    };

    const handleStartProduction = async () => {
        const confirmed = await confirmDialog({
            title: 'Start Production',
            message: 'Move this order to In Progress?',
            confirmText: 'Start Production',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (confirmed) {
            router.patch(route('store.orders.update-status', currentOrder.id), { status: 'In Progress' }, {
                preserveScroll: true,
            });
        }
    };

    const handleRecordCashPayment = async () => {
        const amount = await promptDialog({
            title: 'Record Cash Payment',
            message: 'Enter the cash amount received from the customer:',
            defaultValue: String(currentOrder.amount_paid || currentOrder.total_price || 0),
            placeholder: '0.00',
            confirmText: 'Record Payment',
            cancelText: 'Cancel',
            type: 'info',
            required: true,
        });

        if (!amount || Number(amount) <= 0) {
            return;
        }

        router.post(route('store.orders.cash-payment', currentOrder.id), {
            amount: Number(amount),
        }, {
            preserveScroll: true,
        });
    };

    const handleSettleRemainingBalance = async () => {
        const confirmed = await confirmDialog({
            title: 'Collect Remaining Cash',
            message: 'Confirm that you collected the remaining balance in cash?',
            confirmText: 'Confirm Collection',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (!confirmed) {
            return;
        }

        router.post(route('store.orders.settle-balance', currentOrder.id), {}, {
            preserveScroll: true,
        });
    };

    const acceptRework = async () => {
        const inputNote = await promptDialog({
            title: 'Accept Rework',
            message: 'Add acceptance notes (optional):',
            defaultValue: reworkRequest?.tailor_response_notes || '',
            placeholder: 'Optional notes',
            confirmText: 'Accept',
            cancelText: 'Cancel',
            type: 'success',
            required: false,
        });
        router.patch(`/store/order-reworks/${reworkRequest.id}/accept`, {
            tailor_response_notes: inputNote || null,
        }, { preserveScroll: true });
    };

    const rejectRework = async () => {
        const inputNote = await promptDialog({
            title: 'Reject Rework',
            message: 'Add a rejection reason (required):',
            defaultValue: reworkRequest?.tailor_response_notes || '',
            placeholder: 'Rejection reason',
            confirmText: 'Reject',
            cancelText: 'Cancel',
            type: 'error',
            required: true,
        });
        if (!inputNote || !inputNote.trim()) {
            showAlert({
                title: 'Validation Error',
                message: 'Rejection notes are required.',
                type: 'error',
            });
            return;
        }
        router.patch(`/store/order-reworks/${reworkRequest.id}/reject`, {
            tailor_response_notes: inputNote,
        }, { preserveScroll: true });
    };

    const markReworkGarmentReceived = async () => {
        const inputNote = await promptDialog({
            title: 'Mark Garment Received',
            message: 'Add received notes (optional):',
            defaultValue: reworkRequest?.tailor_response_notes || '',
            placeholder: 'Optional notes',
            confirmText: 'Save',
            cancelText: 'Cancel',
            type: 'info',
            required: false,
        });
        router.patch(`/store/order-reworks/${reworkRequest.id}/received`, {
            tailor_response_notes: inputNote || null,
        }, { preserveScroll: true });
    };

    const markReworkResolved = async () => {
        const inputNote = await promptDialog({
            title: 'Resolve Rework',
            message: 'Add resolution notes (optional):',
            defaultValue: reworkRequest?.tailor_response_notes || '',
            placeholder: 'Optional notes',
            confirmText: 'Resolve',
            cancelText: 'Cancel',
            type: 'success',
            required: false,
        });
        router.patch(`/store/order-reworks/${reworkRequest.id}/status`, {
            status: 'Resolved',
            tailor_response_notes: inputNote || null,
        }, { preserveScroll: true });
    };

    const handleCompleteOrder = async () => {
        const confirmed = await confirmDialog({
            title: 'Mark as Completed',
            message: 'Mark this order as Completed?',
            confirmText: 'Mark as Completed',
            cancelText: 'Cancel',
            type: 'success',
        });

        if (confirmed) {
            router.patch(`/store/orders/${currentOrder.id}/status`, { status: 'Completed' }, {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>

        <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
            <Head title={`Manage Order #${currentOrder.id || '...'}`} />
            
            <div className="max-w-7xl mx-auto w-full px-4">
                {/* Header */}
                <div className="mb-8">
<Link href={route('store.orders')} className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-indigo-600 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Manage Order {currentOrder.id}</h1>
                        {/* Cleaned up Name and Email using our new variable */}
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 shadow-sm">
                                {orderOwner.profile?.avatar_url ? (
                                    <img src={`/storage/${orderOwner.profile.avatar_url}`} alt="Customer" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-black text-stone-400 uppercase">
                                        {(orderOwner.name || 'C').charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-black text-stone-800 leading-tight">{orderOwner.name || 'Customer Name'}</p>
                                <p className="text-sm font-bold text-stone-500">{orderOwner.email || 'Customer Email'}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm font-medium text-stone-500 mt-1">

                                {(() => {
                                    const mapUrl = buildMapUrl(orderOwner.profile?.latitude, orderOwner.profile?.longitude);
                                    const address = orderOwner.profile?.street || orderOwner.profile?.barangay 
                                        ? `${orderOwner.profile?.street || ''}, ${orderOwner.profile?.barangay || ''}`.replace(/(^, )|(,$)/g, '')
                                        : 'Location unavailable';
                                    return mapUrl ? (
                                        <a 
                                            href={mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                        >
                                            <MapPin className="w-4 h-4" /> {address}
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-1 text-stone-500">
                                            <MapPin className="w-4 h-4" /> {address}
                                        </span>
                                    );
                                })()}
                            <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" /> 
                                {orderOwner.profile?.phone || 'No phone provided'}
                            </span>
                        </div>
                    </div>
                    {/* Status Dropdown Placeholder */}
                    <div
                        ref={statusRef}
                        tabIndex={-1}
                        className={`px-6 py-3 font-black rounded-xl text-sm uppercase tracking-wider transition-all duration-500 outline-none ${
                            activeHighlight === 'status'
                                ? 'bg-amber-100 text-amber-900 ring-4 ring-amber-300 ring-offset-2 ring-offset-white'
                                : 'bg-indigo-100 text-indigo-800'
                        }`}
                    >
                        {statusLabel}
                    </div>
                    {isPaymentVerified ? (
                        <div className="flex items-center gap-3">
                            {paymentDisplay.isPartial ? (
                                <>
                                    <div className="px-4 py-3 font-black rounded-xl text-xs uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-sm inline-flex items-center gap-2">
                                        <FiLock className="w-4 h-4" />
                                        Partial: ₱{paymentDisplay.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="px-4 py-3 font-black rounded-xl text-xs uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 shadow-sm inline-flex items-center gap-2">
                                        <TbCurrencyPeso className="w-4 h-4" />
                                        Pending: ₱{paymentDisplay.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {actionFlags.canCollectRemainingCash && (
                                        <button
                                            type="button"
                                            onClick={handleSettleRemainingBalance}
                                            className="px-4 py-3 font-black rounded-xl text-xs uppercase tracking-wider bg-stone-900 text-white shadow-sm inline-flex items-center gap-2 hover:bg-black transition-colors"
                                        >
                                            <TbCurrencyPeso className="w-4 h-4" />
                                            Collect Remaining Cash
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="px-4 py-3 font-black rounded-xl text-xs uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm inline-flex items-center gap-2">
                                    <FiLock className="w-4 h-4" />
                                    Fully Funded: ₱{paymentDisplay.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}
                        </div>
                    ) : (
                        currentOrder.payment_status === 'Pending' && currentOrder.manual_payment_proof_path ? (
                            <div className="mb-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="relative flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
                                        </span>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">Verify Pending Payment</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('orders.verify-payment', currentOrder.id), {
                                                    status: currentOrder.payment_type === 'partial' ? 'Partial' : 'Paid',
                                                }, {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        router.reload({ only: ['order'] });
                                                        setAlertConfig({
                                                            isOpen: true,
                                                            title: 'Payment Approved',
                                                            message: 'The payment has been verified and the order is now Confirmed.',
                                                            type: 'success',
                                                        });
                                                    },
                                                });
                                            }}
                                            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                                        >
                                            Approve Payment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectModal(true)}
                                            className="rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
                                        >
                                            Reject / Invalid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="px-4 py-3 font-black rounded-xl text-xs uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-300 shadow-sm">
                                    Payment: {paymentStatus || 'Pending'}
                                </div>
                                {currentOrder.paymongo_link_id && (
                                    <button
                                        onClick={() => {
                                            router.post(route('orders.verify-payment', currentOrder.id), {}, {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    window.location.reload();
                                                },
                                            });
                                        }}
                                        className="px-3 py-2 font-bold rounded-lg text-xs uppercase tracking-wider bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-colors inline-flex items-center gap-2 shrink-0"
                                    >
                                        <span className="text-sm">🔄</span>
                                        Verify
                                    </button>
                                )}
                            </div>
                        )
                    )}
                    {rawStatus === 'in progress' && (
                        <button
                            onClick={handleMarkReady}
                            disabled={!hasFinishedLook}
                            className={`px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 shrink-0 ml-2 ${
                                hasFinishedLook
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Mark Ready
                        </button>
                    )}
                    {rawStatus === 'in progress' && !hasFinishedLook && (
                        <span className="ml-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                            Upload a finished look photo in Showcase before marking ready.
                        </span>
                    )}

                    {/* NEW: 'Complete Order' button */}
                    {canMarkAsCompleted && (
                        <button
                            onClick={handleCompleteOrder}
                            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Mark as Completed
                        </button>
                    )}
                </div>

                {hasManualPaymentProof && (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h4 className="text-lg font-black text-stone-900">Manual Payment Submission</h4>
                            {manualReferenceId && (
                                <p className="mt-1 text-sm text-stone-600">
                                    The customer has uploaded proof for a manual transfer (Reference: <strong className="font-mono text-indigo-600">{manualReferenceId}</strong>). Please verify this against your GCash records.
                                </p>
                            )}
                        </div>

                        {manualProofUrl ? (
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                                <button
                                    type="button"
                                    onClick={() => setIsProofViewerOpen(true)}
                                    className="relative group w-full sm:w-52 h-36 rounded-xl overflow-hidden border border-stone-200 bg-white"
                                    title="Expand payment proof"
                                >
                                    <img
                                        src={manualProofUrl}
                                        alt="Manual payment proof"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/30 transition-colors" />
                                </button>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsProofViewerOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                        Expand
                                    </button>
                                    <a
                                        href={manualProofUrl}
                                        download={`order-${currentOrder.id}-payment-proof`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-rose-700">No proof image uploaded yet.</p>
                        )}
                    </div>
                )}
                </div>

                {reworkRequest && (
                    <div
                        ref={reworkRef}
                        tabIndex={-1}
                        className={`mb-6 rounded-2xl border p-5 md:p-6 shadow-sm outline-none transition-all duration-500 ${
                            activeHighlight === 'rework'
                                ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-stone-50 border-amber-300 bg-amber-50'
                                : 'border-amber-200 bg-amber-50/70'
                        }`}
                    >
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700 mb-2">Post-Completion Rework</p>
                        <h3 className="text-xl font-black text-stone-900 mb-2">
                            {reworkStatus === 'Pending Review' ? 'Pending Review' : reworkStatus === 'Accepted' ? 'Fix in Progress' : reworkStatus === 'Resolved' ? 'Resolved' : `Rework ${reworkStatus || 'Pending Review'}`}
                        </h3>
                        <p className="text-sm text-stone-700"><span className="font-bold">Category:</span> {reworkRequest.reason_category}</p>
                        <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Customer Notes:</span> {reworkRequest.customer_notes}</p>

                        {!!reworkRequest?.proof_images?.length && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {reworkRequest.proof_images.map((img, idx) => (
                                    <img
                                        key={`rework-proof-${idx}`}
                                        src={img?.startsWith('http') ? img : `/storage/${img}`}
                                        alt="Rework proof"
                                        className="w-full h-24 object-cover rounded-xl border border-amber-200 bg-white"
                                    />
                                ))}
                            </div>
                        )}

                        {reworkRequest.tailor_response_notes && (
                            <p className="text-sm text-stone-700 mt-4"><span className="font-bold">Tailor Notes:</span> {reworkRequest.tailor_response_notes}</p>
                        )}
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100 mb-6 overflow-x-auto">
                    {['overview', 'measurements & quote', 'showcase', 'timeline', 'rework'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                if (tab === 'showcase' && !canAccessShowcase) return;
                                setActiveTab(tab);
                            }}
                            disabled={tab === 'showcase' && !canAccessShowcase}
                            className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 capitalize ${
                                activeTab === tab 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                                    : tab === 'showcase' && !canAccessShowcase
                                        ? 'text-stone-300 bg-stone-50 cursor-not-allowed'
                                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                            }`}
                        >
{tab === 'overview' && <ClipboardList className="w-4 h-4" />}
{tab === 'measurements & quote' && <Ruler className="w-4 h-4" />}
{tab === 'showcase' && <Camera className="w-4 h-4" />}
{tab === 'timeline' && <ClipboardList className="w-4 h-4" />}
{tab === 'rework' && (
    <>
        <ClipboardList className="w-4 h-4" />
        <span className="flex items-center gap-2">
            Rework
            {hasActiveReworkStatus && (
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                </span>
            )}
        </span>
    </>
)}
                            {tab !== 'rework' && tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content Areas */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8 min-h-[500px]">
{activeTab === 'overview' && (
    <div className="space-y-6">
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 mb-2">Order Actions</p>
                    <h3 className="text-2xl font-black text-slate-900">Update Status</h3>
                    <p className="mt-2 text-sm text-stone-700 max-w-2xl">
                        Move the order forward without relying on photo uploads. Progress photos remain optional in the Showcase tab.
                    </p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-xs font-bold text-indigo-700 shadow-sm">
                    Current Status: {currentOrder.status || 'Pending'}
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                        {!(currentOrder.payment_status === 'Pending' && currentOrder.manual_payment_proof_path) && actionFlags.canRecordCashPayment && (
                            <button
                                type="button"
                                onClick={handleRecordCashPayment}
                                className="w-full rounded-2xl bg-amber-600 px-5 py-4 text-left font-black text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-700"
                            >
                                <span className="block text-base">Record Cash Payment</span>
                                <span className="mt-1 block text-sm font-medium text-amber-100">
                                    Record a manual cash payment before moving the order forward.
                                </span>
                            </button>
                        )}

                {actionFlags.canStartProduction && (
                    <button
                        type="button"
                        onClick={handleStartProduction}
                        className="w-full rounded-2xl bg-indigo-600 px-5 py-4 text-left font-black text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
                    >
                        <span className="block text-base">Start Production</span>
                        <span className="mt-1 block text-sm font-medium text-indigo-100">
                            Move the order to In Progress and begin tailoring.
                        </span>
                    </button>
                )}

                {actionFlags.canMarkReadyForPickup && (
                    <button
                        type="button"
                        onClick={handleMarkReady}
                        className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-left font-black text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700"
                    >
                        <span className="block text-base">Mark Ready for Pickup</span>
                        <span className="mt-1 block text-sm font-medium text-emerald-100">
                            Optional: Uploading a finished look photo lets the customer preview the final product in Showcase.
                        </span>
                    </button>
                )}

                {actionFlags.canMarkCompleted && (
                    <button
                        type="button"
                        onClick={handleCompleteOrder}
                        className="w-full rounded-2xl bg-stone-900 px-5 py-4 text-left font-black text-white shadow-lg shadow-stone-300 transition-colors hover:bg-black"
                    >
                        <span className="block text-base">Mark as Completed</span>
                        <span className="mt-1 block text-sm font-medium text-stone-200">
                            Click this once the customer has received the item. This will trigger your escrow payout.
                        </span>
                    </button>
                )}

                        {!['quoted', 'confirmed', 'ready for production', 'in progress', 'ready for pickup'].includes(rawStatus) && (
                            <p className="rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-3 text-sm text-stone-600">
                                Status actions appear once the order is Quoted, Confirmed, Ready for Production, In Progress, or Ready for Pickup.
                            </p>
                        )}

            </div>
        </section>

        <TailorOverview 
            currentOrder={currentOrder}
            tailorMaterials={tailorMaterials}
            availableShopAttributes={availableShopAttributes}
            onAccept={handleAccept}
            onReject={() => setShowRejectModal(true)}
        />
    </div>
)}
{activeTab === 'measurements & quote' && (
                    <div
                        ref={measurementsRef}
                        tabIndex={-1}
                        className={`rounded-2xl transition-all duration-500 outline-none ${
                            activeHighlight === 'measurements'
                                ? 'ring-4 ring-indigo-300 ring-offset-2 ring-offset-white bg-indigo-50/60'
                                : ''
                        }`}
                    >
                        <div
                            ref={quoteRef}
                            tabIndex={-1}
                            className={`rounded-2xl transition-all duration-500 outline-none ${
                                activeHighlight === 'quote'
                                    ? 'ring-4 ring-emerald-300 ring-offset-2 ring-offset-white bg-emerald-50/60'
                                    : ''
                            }`}
                        >
                            <TailorQuoteBuilder
                                currentOrder={currentOrder}
                                categories={categories}
                                availableShopAttributes={availableShopAttributes}
                                tailorMaterials={tailorMaterials}
                                setTailorMaterials={setTailorMaterials}
                                addMaterial={addMaterial}
                                removeMaterial={removeMaterial}
                                updateMaterial={updateMaterial}
                                laborPrice={laborPrice}
                                setLaborPrice={setLaborPrice}
                                rushFee={rushFee}
                                setRushFee={setRushFee}
                                productionMinDays={productionMinDays}
                                setProductionMinDays={setProductionMinDays}
                                productionMaxDays={productionMaxDays}
                                setProductionMaxDays={setProductionMaxDays}
                                measurementFields={measurementFields}
                                setMeasurementFields={setMeasurementFields}
                                measurementUnit={measurementUnit}
                                setMeasurementUnit={setMeasurementUnit}
                                isCustomerProvided={isCustomerProvided}
                                handleSendQuote={handleSendQuote}
                                isSubmittingQuote={isSubmittingQuote}
                                handleSendMeasurements={handleSendMeasurements}
                                isSubmittingMeasurements={isSubmittingMeasurements}
                                measurementSuccess={measurementSuccess}
                                isMeasurementLocked={isMeasurementLocked}
                                isQuoteLocked={isQuoteLocked}
                            />
                        </div>
                    </div>
                    )}
{activeTab === 'showcase' && canAccessShowcase && (
                    <div
                        ref={showcaseRef}
                        tabIndex={-1}
                        className={`rounded-2xl transition-all duration-500 outline-none ${
                            activeHighlight === 'showcase'
                                ? 'ring-4 ring-emerald-300 ring-offset-2 ring-offset-white bg-emerald-50/60'
                                : ''
                        }`}
                    >
                        <TailorShowcase 
                            // disabled={currentOrder.status === 'Requested' || currentOrder.status === 'Quoted' }
                            currentOrder={currentOrder}
                        />
                    </div>
                    )}
{activeTab === 'showcase' && !canAccessShowcase && (
    <div className="p-10 rounded-3xl border border-stone-200 bg-stone-50 text-center">
        <h3 className="text-2xl font-black text-stone-900 mb-2">Showcase Locked</h3>
        <p className="text-stone-600 font-medium">The showcase tab becomes available only after the order is confirmed.</p>
    </div>
)}
{activeTab === 'timeline' && (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Audit Timeline</h3>

        {orderLogs.length > 0 ? (
            <div className="space-y-4">
                {orderLogs.map((log, index) => {
                    const actorName = log?.user?.name || 'System';
                    const actorRole = log?.user?.role ? ` (${log.user.role.replace('_', ' ')})` : '';

                    return (
                        <div key={log.id || `${log.action}-${index}`} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <span className="h-3 w-3 rounded-full bg-indigo-600 mt-1" />
                                {index !== orderLogs.length - 1 && <span className="w-px flex-1 bg-stone-200 mt-1" />}
                            </div>

                            <div className="pb-4">
                                <p className="text-sm font-black text-stone-900">
                                    {log.description || log.action || 'Order updated'}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    By {actorName}{actorRole} - {formatTimelineDate(log.created_at)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <p className="text-sm text-stone-600">No audit logs available for this order yet.</p>
        )}
    </section>
)}
{activeTab === 'rework' && (
    <div
        ref={reworkRef}
        tabIndex={-1}
        className={`space-y-6 rounded-2xl outline-none transition-all duration-500 ${
            activeHighlight === 'rework'
                ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-white bg-amber-50/60 p-4'
                : ''
        }`}
    >
        <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] mb-2">Post-Completion Rework</h3>
            {reworkRequest ? (
                <>
                    <p className="text-lg font-black text-stone-900">Rework {reworkStatus || 'Pending Review'}</p>
                    <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Category:</span> {reworkRequest.reason_category}</p>
                    <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Customer Notes:</span> {reworkRequest.customer_notes}</p>
                    {!!reworkRequest?.proof_images?.length && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {reworkRequest.proof_images.map((img, idx) => (
                                <img key={`tailor-rework-proof-${idx}`} src={img?.startsWith('http') ? img : `/storage/${img}`} alt="Rework proof" className="w-full h-24 object-cover rounded-xl border border-amber-200 bg-white" />
                            ))}
                        </div>
                    )}
                    {reworkRequest.tailor_response_notes && (
                        <p className="text-sm text-stone-700 mt-4"><span className="font-bold">Tailor Response:</span> {reworkRequest.tailor_response_notes}</p>
                    )}

                    {reworkStatus === 'Pending Review' && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button type="button" onClick={acceptRework} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Accept Rework</button>
                            <button type="button" onClick={rejectRework} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">Reject Rework</button>
                        </div>
                    )}
                    {reworkStatus === 'Accepted' && (
                        <div className="mt-4">
                            <button type="button" onClick={markReworkGarmentReceived} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold">
                                Rework Garment Received
                            </button>
                        </div>
                    )}
                    {reworkStatus === 'In Progress' && (
                        <div className="mt-4">
                            <button type="button" onClick={markReworkResolved} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                                Mark Rework as Resolved
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-sm text-stone-600">No rework request has been submitted for this order.</p>
            )}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Read-Only Design Context</h3>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
                    {currentOrder.design_image ? (
                        <img src={`/storage/${currentOrder.design_image}`} alt="Design reference" className="w-full h-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs font-bold">No image</div>
                    )}
                </div>
                <div className="flex-1 space-y-3 text-sm">
                    <p><span className="font-bold">Style Tag:</span> {currentOrder.style_tag || 'N/A'}</p>
                    <p><span className="font-bold">Customer Design Notes:</span> {currentOrder.notes || 'No notes provided.'}</p>
                    <p className="text-xs text-stone-500">Design and material records are intentionally read-only in rework mode.</p>
                </div>
            </div>
        </section>
    </div>
)}

                    {isProofViewerOpen && manualProofUrl && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) {
                                    setIsProofViewerOpen(false);
                                }
                            }}
                        >
                            <div className="relative w-full max-w-5xl rounded-2xl border border-stone-200 bg-stone-950 p-3 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setIsProofViewerOpen(false)}
                                    className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-white hover:bg-stone-800"
                                    aria-label="Close proof preview"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <img
                                    src={manualProofUrl}
                                    alt="Manual payment proof full preview"
                                    className="max-h-[85vh] w-full rounded-xl object-contain"
                                />

                                <div className="mt-3 flex justify-end">
                                    <a
                                        href={manualProofUrl}
                                        download={`order-${currentOrder.id}-payment-proof`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Image
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reject Modal */}
                    {showRejectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800">Reject Payment</h2>
                                </div>
                                <form onSubmit={handleReject} className="p-6 space-y-6">
                                    <p className="text-sm text-stone-600 font-medium">Please explain why this payment proof is invalid so the customer can fix it.</p>
                                    <textarea
                                        className="w-full rounded-xl border-stone-300 bg-stone-50 p-3 text-sm focus:border-rose-500 focus:ring-rose-500"
                                        rows="3"
                                        placeholder="e.g., The screenshot is too blurry to read the reference number..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-3 pt-4 border-t border-stone-100">
                                        <button type="button" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition">Cancel</button>
                                        <button type="submit" disabled={!rejectReason.trim()} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-md disabled:opacity-50">Confirm Rejection</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
                <AlertModal 
                    {...alertConfig} 
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
                />
        </div>
        </AuthenticatedLayout>
    );
}

