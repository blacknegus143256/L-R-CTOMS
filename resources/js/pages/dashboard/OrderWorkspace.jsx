import React, { useEffect, useRef, useState } from 'react';
import AlertModal from '@/Components/AlertModal.jsx';
import { buildMapUrl } from '@/utils/map';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Package, FileText, Camera, Phone, MapPin, ClipboardList } from 'lucide-react';
import OrderTracking from './OrderComponents/OrderTracking.jsx';
import OrderDetails from './OrderComponents/OrderDetails.jsx';
import OrderShowcase from './OrderComponents/OrderShowcase.jsx';
import { TbCurrencyPeso } from 'react-icons/tb';

/**
 * OrderWorkspace Component
 * A dedicated full-screen page for customers to view the complete context of a single order.
 * Replaces the old "Mega-Modal" to provide a clean, tabbed interface for Tracking, Details, and Showcase.
 */
export default function OrderWorkspace({ auth, order }) {
    const { props, url } = usePage();
    const parsedUrl = new URL(url, 'http://localhost');
    const requestedTab = (parsedUrl.searchParams.get('tab') || '').trim().toLowerCase();
    const highlightSection = (parsedUrl.searchParams.get('highlight') || parsedUrl.hash?.replace('#', '') || '').trim().toLowerCase();
    const validHighlights = ['measurements', 'quote', 'showcase', 'status', 'rework', 'timeline'];
    // State to manage which tab is currently visible to the user. Defaults to 'tracking'.
    const [activeTab, setActiveTab] = useState('tracking');
    const [activeHighlight, setActiveHighlight] = useState(null);
    const measurementsRef = useRef(null);
    const quoteRef = useRef(null);
    const statusRef = useRef(null);
    const showcaseRef = useRef(null);
    const reworkRef = useRef(null);
    
    // The actual order data passed from the backend controller
    const currentOrder = order || {};
    const reworkRequest = currentOrder?.rework_request;
    const reworkRequests = Array.isArray(currentOrder?.rework_requests)
        ? currentOrder.rework_requests
        : reworkRequest
            ? [reworkRequest]
            : [];
    const hasActiveReworkStatus = reworkRequests.some((item) => {
        const status = String(item?.status || '').trim().toLowerCase();
        return status === 'resolved' || status === 'approved' || status === 'accepted';
    });

    // Quote acceptance states
    const [customerMeasurements, setCustomerMeasurements] = useState(() => {
        const requested = currentOrder.measurement_snapshot?.requested;
        if (Array.isArray(requested)) {
            // Ensure we map the objects sent by the tailor into input objects
            return requested.map(req => ({
                name: req.name || req,
                instruction: req.instruction || '',
                value: '' // This is what the customer will fill out
            }));
        }
        return [];
    });
    const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        if (requestedTab === 'rework') {
            setActiveTab('rework');
            setActiveHighlight('rework');
            return;
        }

        if (!validHighlights.includes(highlightSection)) return;

        const tabMapping = {
            measurements: 'details',
            quote: 'details',
            showcase: 'showcase',
            status: 'tracking',
            rework: 'rework',
            timeline: 'timeline',
        };

        const targetTab = tabMapping[highlightSection];

        if (targetTab) {
            setActiveTab(targetTab);
        }

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

        const timer = setTimeout(() => {
            if (targetRef?.current) {
                targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRef.current.focus();
            }

            window.history.replaceState({}, '', window.location.pathname);

            setActiveHighlight(null);
        }, 200);

        return () => {
            clearTimeout(timer);
        };
    }, [activeTab, activeHighlight]);


    // Shop data for components
    const shopFromProps = props.shop || props.auth?.shop;
    const shopFromOrder = currentOrder?.tailoringShop || currentOrder?.shop;
    const shop = shopFromProps?.attributes ? shopFromProps : (shopFromOrder?.attributes ? shopFromOrder : (shopFromProps || shopFromOrder || {}));
    const availableShopAttributes = shop.attributes || [];
    const orderLogs = Array.isArray(currentOrder.logs) ? currentOrder.logs : [];

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

    // Safe status normalization for bulletproof timeline + button logic
    const rawStatus = (currentOrder.status || 'Requested')
        .toString()
        .trim()
        .toLowerCase();

    /**
     * Statuses Configuration Array
     * Defines the linear progression of an order. The order of this array determines 
     * the visual order of the vertical timeline.
     */


    /**
     * Timeline Logic Map
     * We find the numerical index of the current order's status within our statuses array.
     * This index is used to determine if a step in the map is in the past (completed), 
     * present (active), or future (dimmed).
     */




const handleAcceptQuote = (e) => {
    if (e) e.preventDefault();

    return new Promise((resolve, reject) => {
        const normalizedMeasurementType = (currentOrder.measurement_type || '').toString().trim().toLowerCase();
        const requiresSubmittedMeasurements = ['profile', 'self_measured'].includes(normalizedMeasurementType);

        let submittedMeasurements = [];

        // Only build measurements for customer-submitted measurement flows.
        if (requiresSubmittedMeasurements) {
            submittedMeasurements = [];

            for (const m of customerMeasurements) {
                const parsedValue = parseFloat(m.value);

                if (isNaN(parsedValue) || !m.value.trim()) {
                    const error = new Error(`Please enter valid numbers for ${m.name}`);
                    setAlertConfig({ isOpen: true, title: 'Validation Error', message: error.message, type: 'error' });
                    reject(error);
                    return;
                }

                submittedMeasurements.push({
                    name: m.name,
                    value: parsedValue
                });
            }
        }

        setIsAcceptingQuote(true);

        router.patch(`/my-orders/${currentOrder.id}/accept`, {
            submitted_measurements: submittedMeasurements
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAcceptingQuote(false);
                setAlertConfig({ isOpen: true, title: 'Success', message: 'Order Confirmed! The tailor will begin production soon.', type: 'success' });
                resolve();
            },
            onError: () => {
                setIsAcceptingQuote(false);
                reject(new Error('Failed to confirm the quote.'));
            }
        });
    });
};


    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Order #${currentOrder.id}`} />
            
            <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto w-full px-4">
                
{/* {currentOrder.shop?.user?.profile?.street || currentOrder.tailoringShop?.user?.profile?.street ? `${currentOrder.shop?.user?.profile?.street || currentOrder.tailoringShop?.user?.profile?.street}, ` : ''} */}
            {/* ================= HEADER SECTION ================= */}
                <div className="mb-8">
                    {/* Back Navigation */}
                    <Link href={route('customer.orders')} className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-orchid-600 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Orders
                    </Link>

                    {/* Sticky Shop Info Banner & Order Title */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-orchid-200 items-center justify-center shrink-0 shadow-sm">
                                {((currentOrder.shop?.logo_url || currentOrder.tailoringShop?.logo_url) || (currentOrder.shop?.user?.profile?.avatar_url || currentOrder.tailoringShop?.user?.profile?.avatar_url)) ? (
                                    <img src={`/storage/${(currentOrder.shop?.logo_url || currentOrder.tailoringShop?.logo_url) || (currentOrder.shop?.user?.profile?.avatar_url || currentOrder.tailoringShop?.user?.profile?.avatar_url)}`} alt="Shop Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-orchid-700 font-black text-xl uppercase">
                                        {(currentOrder.shop?.user?.name || currentOrder.tailoringShop?.user?.name || currentOrder.shop?.shop_name || currentOrder.tailoringShop?.shop_name || 'S').charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 mb-2">Order #{currentOrder.id}</h1>
                                <div className="flex flex-col mb-2">
                                    <span className="font-bold text-slate-800 text-base leading-tight">
                                        {currentOrder.shop?.shop_name || currentOrder.tailoringShop?.shop_name || 'Assigned Shop'}
                                    </span>
                                    <span className="text-xs font-bold text-stone-400">
                                        {currentOrder.shop?.owner_name || currentOrder.tailoringShop?.owner_name || currentOrder.shop?.user?.name || currentOrder.tailoringShop?.user?.name || 'Shop Owner'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm font-medium text-stone-500 mt-1">
                                    {(() => {
                                        const shopLat = currentOrder.shop?.user?.profile?.latitude || currentOrder.tailoringShop?.user?.profile?.latitude;
                                        const shopLng = currentOrder.shop?.user?.profile?.longitude || currentOrder.tailoringShop?.user?.profile?.longitude;
                                        const mapUrl = buildMapUrl(shopLat, shopLng);
                                        const street = currentOrder.shop?.user?.profile?.street || currentOrder.tailoringShop?.user?.profile?.street;
                                        const barangay = currentOrder.shop?.user?.profile?.barangay || currentOrder.tailoringShop?.user?.profile?.barangay;
                                        const address = street || barangay ? `${street || ''}, ${barangay}`.replace(/^, |, $/, '') : 'Location unavailable';
                                        return mapUrl ? (
                                            <a 
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
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
                                        {currentOrder.shop?.user?.profile?.phone || currentOrder.tailoringShop?.user?.profile?.phone || 'No phone provided'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                ref={statusRef}
                                tabIndex={-1}
                                className={`px-4 py-2 font-bold rounded-xl text-sm tracking-wide uppercase transition-all duration-500 outline-none ${
                                    activeHighlight === 'status'
                                        ? 'bg-amber-100 text-amber-900 ring-4 ring-amber-300 ring-offset-2 ring-offset-white'
                                        : 'bg-orchid-100 text-orchid-800'
                                }`}
                            >
                                {currentOrder.status || 'Pending'}
                            </div>

                            <Link 
                                href={`/shops/${currentOrder.shop?.id || currentOrder.tailoringShop?.id || 1}`}
                                className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-orchid-50 hover:text-orchid-700 text-sm font-bold rounded-lg border border-stone-200 transition-colors shrink-0"
                            >
                                Visit Shop →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ================= TABS NAVIGATION ================= */}
                <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100 mb-6 overflow-x-auto">
                    {['tracking', 'details', 'showcase', 'timeline', 'rework'].map((tab) => {
                        const isQuoted = currentOrder.status === 'Quoted';
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 capitalize ${
                                    activeTab === tab 
                                        ? 'bg-indigo-600 text-white shadow-md shadow-orchid-500/20' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                                }`}
                            >
                                {(tab === 'tracking' && isQuoted) && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                                )}
                                {tab === 'tracking' && <Package className="w-4 h-4" />}
                                {tab === 'details' && <FileText className="w-4 h-4" />}
                                {tab === 'showcase' && <Camera className="w-4 h-4" />}
                                {tab === 'timeline' && <ClipboardList className="w-4 h-4" />}
                                {tab === 'rework' && (
                                    <>
                                        <FileText className="w-4 h-4" />
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
                        );
                    })}
                </div>

                {/* ================= TAB CONTENT AREA ================= */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
                    
                    {/* TAB 1: TRACKING (Vertical Timeline) */}
{activeTab === 'tracking' && (
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
                                <OrderTracking
                                    currentOrder={currentOrder}
                                    customerMeasurements={customerMeasurements}
                                    setCustomerMeasurements={setCustomerMeasurements}
                                    isAcceptingQuote={isAcceptingQuote}
                                    setIsAcceptingQuote={setIsAcceptingQuote}
                                    shop={shop}
                                    onAcceptQuote={handleAcceptQuote}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DETAILS & INVOICE */}
                    {activeTab === 'details' && (
                        <OrderDetails 
                            currentOrder={currentOrder} 
                            shop={shop} 
                            availableShopAttributes={availableShopAttributes}
                            customerMeasurements={customerMeasurements}
                            setCustomerMeasurements={setCustomerMeasurements}
                            isAcceptingQuote={isAcceptingQuote}
                            setIsAcceptingQuote={setIsAcceptingQuote} 
                            onAcceptQuote={handleAcceptQuote}
                            reworkRef={reworkRef}
                        />
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
                            className={`space-y-6 rounded-2xl transition-all duration-500 outline-none ${
                                activeHighlight === 'rework'
                                    ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-white bg-amber-50/60 p-4'
                                    : ''
                            }`}
                        >
                            <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
                                <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] mb-2">Post-Completion Rework</h3>
                                {currentOrder?.rework_request ? (
                                    <>
                                        <p className="text-lg font-black text-stone-900">Rework {currentOrder.rework_request.status}</p>
                                        <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Category:</span> {currentOrder.rework_request.reason_category}</p>
                                        <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Your Notes:</span> {currentOrder.rework_request.customer_notes}</p>
                                        {!!currentOrder.rework_request?.proof_images?.length && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {currentOrder.rework_request.proof_images.map((img, idx) => (
                                                    <img key={`rework-proof-${idx}`} src={img?.startsWith('http') ? img : `/storage/${img}`} alt="Rework proof" className="w-full h-24 object-cover rounded-xl border border-amber-200 bg-white" />
                                                ))}
                                            </div>
                                        )}
                                        {currentOrder.rework_request.tailor_response_notes && (
                                            <p className="text-sm text-stone-700 mt-4"><span className="font-bold">Tailor Response:</span> {currentOrder.rework_request.tailor_response_notes}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-stone-600">Open the Details tab to submit a rework request once the order is completed.</p>
                                )}
                            </section>

                            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Read-Only Design and Materials</h3>
                                <p className="text-sm text-stone-600 mb-4">Original design intent and material records are locked during rework handling.</p>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
                                        <p><span className="font-bold">Style Tag:</span> {currentOrder.style_tag || 'N/A'}</p>
                                        <p className="mt-2"><span className="font-bold">Design Notes:</span> {currentOrder.notes || 'No notes provided.'}</p>
                                    </div>
                                    <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
                                        <p className="font-bold mb-2">Material Records</p>
                                        <p>{Array.isArray(currentOrder.items) ? `${currentOrder.items.length} original item(s)` : 'No item records'}</p>
                                        <p>{Array.isArray(currentOrder.required_materials) ? `${currentOrder.required_materials.length} required material(s)` : 'No required materials'}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* TAB 3: SHOWCASE & PROGRESS PHOTOS */}
                    {activeTab === 'showcase' && (
                        <div
                            ref={showcaseRef}
                            tabIndex={-1}
                            className={`rounded-2xl transition-all duration-500 outline-none ${
                                activeHighlight === 'showcase'
                                    ? 'ring-4 ring-emerald-300 ring-offset-2 ring-offset-white bg-emerald-50/60'
                                    : ''
                            }`}
                        >
                            <OrderShowcase currentOrder={currentOrder} />
                        </div>
                        // <div className="space-y-6">
                        //     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        //         <div>
                        //             <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        //                 <Camera className="w-6 h-6 text-orchid-600" />
                        //                 Order Showcase
                        //             </h2>
                        //             <p className="text-stone-500 text-sm mt-1">Photos of your garment's progress and final result.</p>
                        //         </div>
                        //     </div>

                        //     {/* Gallery Grid */}
                        //     {currentOrder.images && currentOrder.images.length > 0 ? (
                        //         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        //             {currentOrder.images.map((img, idx) => (
                        //                 <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200 cursor-pointer">
                        //                     <img 
                        //                         src={`/storage/${img.image_path || img.url}`} 
                        //                         alt={`Progress photo ${idx + 1}`} 
                        //                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        //                         onError={(e) => {
                        //                             e.target.onerror = null;
                        //                             e.target.src = '/images/default-service.jpg';
                        //                         }}
                        //                     />
                        //                     <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        //                         <span className="text-white font-bold text-sm tracking-wide">
                        //                             {img.caption || 'Progress Photo'}
                        //                         </span>
                        //                     </div>
                        //                 </div>
                        //             ))}
                        //         </div>
                        //     ) : (
                        //         /* Empty State */
                        //         <div className="text-center py-16 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl">
                        //             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        //                 <Camera className="w-10 h-10 text-stone-300" />
                        //             </div>
                        //             <h3 className="text-lg font-bold text-slate-800">No Photos Yet</h3>
                        //             <p className="text-stone-500 mt-2 max-w-md mx-auto">
                        //                 The tailor hasn't uploaded any progress photos for this order yet. Check back later once sewing begins!
                        //             </p>
                        //         </div>
                        //     )}
                        // </div>
                    )}

                </div>
                <AlertModal 
                    {...alertConfig} 
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
                />
            </div>
            </div>
        </AuthenticatedLayout>
    );
}
