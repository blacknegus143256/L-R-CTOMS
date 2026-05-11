import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {  TbCurrencyPeso } from 'react-icons/tb';
import { Camera, MapPin, Phone, CheckCircle, Printer, Download, Maximize2, X, Ruler, Check, AlertTriangle, Clock3, Wallet, Info } from 'lucide-react';
import { showAlert } from '@/utils/alert';
import { generateReceipt } from '@/utils/receiptGenerator';
import { showNotification } from '@/utils/notification';
import PaymentModal from './PaymentModal';
import { filterImageFiles } from '@/utils/imageUpload';

const OrderDetails = ({ currentOrder, shop, availableShopAttributes, customerMeasurements, setCustomerMeasurements, isAcceptingQuote, onAcceptQuote, reworkRef, globalMeasurements = {}, reworkSubmissionSignal = 0 }) => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [isDecliningQuote, setIsDecliningQuote] = useState(false);
    const declineReasons = [
        'Budgetary Constraints: The proposed cost exceeds your current allocated budget or the pricing structure is unappealing.',
        'Strategic Misalignment: The offering does not currently align with your organization\'s short-term goals or long-term business strategy.',
        'Better Fit Elsewhere: You have identified another vendor that more closely matches your specific requirements, criteria, or technical standards.',
        'Unfavorable Timing: The proposal is strong, but your team is currently focused on other priorities and cannot commit the necessary resources or bandwidth to implement it now.',
        'In-house Solutions: You have decided to utilize existing internal resources rather than hire an outside consultant or service provider.',
        'Existing Partnerships: You already have a contract or established working relationship with a provider that effectively meets your needs.',
        'Suitability & Customization: The product or service is too generic and fails to address your unique business needs or industry-specific requirements.'
    ];
// Modal state removed - inline form handles measurements
    // Fixed Final Invoice Math: initial items + tailor required_materials
    const initialItemsTotal = (currentOrder.items || [])
        .filter(item => Number(item.price || item.pivot?.price) > 0)
        .reduce((total, item) => total + (Number(item.price || item.pivot?.price || 0) * Number(item.quantity || item.pivot?.quantity || 1)), 0);

    const addedMaterialsTotal = (currentOrder.required_materials || [])
        .reduce((total, req) => total + (Number(req.price || 0) * Number(req.quantity || 1)), 0);

    const materialsTotal = initialItemsTotal + addedMaterialsTotal;
    const grandTotal = Number(currentOrder.total_amount || currentOrder.total_price || 0);
const rushFee = Number(currentOrder.rush_fee || 0);
const baseLabor = Number(currentOrder.labor_price || 0) || (grandTotal > 0 ? Math.max(0, grandTotal - materialsTotal - rushFee) : Number(currentOrder.orderServices?.[0]?.price || 0));
    const productionMinDays = Number(currentOrder.production_min_days || 0);
    const productionMaxDays = Number(currentOrder.production_max_days || 0);
    const hasExpectedCompletionDate = !!currentOrder.expected_completion_date;
    const hasLeadTimeEstimate = !hasExpectedCompletionDate && productionMaxDays > 0;
    const reworkRequest = currentOrder?.rework_request;
    const reworkStatus = String(reworkRequest?.status || '').trim().toLowerCase();
    const [showReworkModal, setShowReworkModal] = useState(false);
    const [isSubmittingRework, setIsSubmittingRework] = useState(false);
    const [reworkReasonCategory, setReworkReasonCategory] = useState('Fit Issue');
    const [reworkCustomerNotes, setReworkCustomerNotes] = useState('');
    const [reworkProofImages, setReworkProofImages] = useState([]);
    const [reworkProofError, setReworkProofError] = useState('');
    const [isReworkDragActive, setIsReworkDragActive] = useState(false);
    const amountPaid = Number(currentOrder.amount_paid || 0);
    const remainingBalance = Math.max(0, grandTotal - amountPaid);
    const downpaymentAmount = grandTotal / 2;
    const fitMethodName = currentOrder.fit_method?.name || currentOrder.fitMethod?.name || 'Unknown';
    
    const handleViewMap = () => {
        if (fitMethodName === 'Home Visit') {
            const lat = currentOrder.user?.profile?.latitude;
            const lng = currentOrder.user?.profile?.longitude;

            if (lat && lng) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
            } else {
                showNotification?.warning('Your location coordinates are missing.');
            }
        } else if (fitMethodName === 'In-Shop Fitting') {
            const shop = currentOrder.tailoring_shop || currentOrder.shop || currentOrder.tailoringShop;
            const profile = shop?.user?.profile || currentOrder.shop?.user?.profile || shopProfile;

            // Prioritize direct Google Maps link
            const mapsLink = shop?.google_maps_link || profile?.google_maps_link;
            if (mapsLink) {
                const formattedLink = mapsLink.startsWith('http') ? mapsLink : `https://${mapsLink}`;
                window.open(formattedLink, '_blank');
                return;
            }

            const lat = profile?.latitude;
            const lng = profile?.longitude;

            if (lat && lng) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
            } else {
                showNotification?.warning('Shop location coordinates are missing.');
            }
        }
    };
    const customerAddress = currentOrder.user?.profile
        ? `${currentOrder.user.profile.street || 'Address not provided'}, ${currentOrder.user.profile.barangay || ''}`.replace(/,\s*$/, '')
        : 'Address not provided';
    const shopProfile = currentOrder.tailoring_shop?.user?.profile || currentOrder.tailoringShop?.user?.profile || shop?.user?.profile || null;
    const shopAddress = shopProfile
        ? `${shopProfile.street || 'Shop Address'}, ${shopProfile.barangay || ''}`.replace(/,\s*$/, '')
        : 'Shop Address';
    const pendingMeasures = (currentOrder.order_measurements || []).filter((measurement) => !(measurement.measurement_value || measurement.value));
    const completedMeasures = (currentOrder.order_measurements || []).filter((m) => m.measurement_value || m.value);
    const requiresRemoteMeasurements = fitMethodName === 'Self-Measured';
    const lockedMeasurementUnit = (() => {
        const fromSnapshot = currentOrder.measurement_snapshot?.unit;
        const fromOrder = currentOrder.unit;
        const candidate = String(fromSnapshot || fromOrder || 'inches').trim().toLowerCase();
        return candidate === 'cm' ? 'cm' : 'inches';
    })();
    const lockedMeasurementUnitLabel = lockedMeasurementUnit.toUpperCase();
    const hasPendingMeasurements = requiresRemoteMeasurements && pendingMeasures.length > 0;
    const hasRecordedMeasurements = Boolean(currentOrder?.measurements_taken) || completedMeasures.length > 0;
    const canPay = fitMethodName === 'No Measurement Required' || hasRecordedMeasurements;
    const paymentStatusRaw = (currentOrder.payment?.status?.name || currentOrder.payment_status || currentOrder.payment?.payment_status || '').toString().trim();
    const isPaymentUnderReview = paymentStatusRaw === 'Pending' && !!currentOrder.manual_payment_proof_path;
    const rejectionMatch = currentOrder.notes?.match(/PAYMENT_REJECTED:\s*(.*?)(?:\n\n|$)/);
    const rejectionReason = rejectionMatch ? rejectionMatch[1] : null;
    const orderAppointments = Array.isArray(currentOrder.appointments) ? currentOrder.appointments : [];
    // Prefer an appointment that has a date; this represents the fitting/visit slot
    const fittingAppointment = orderAppointments.find(a => a && a.date) || null;

    const formatAppointment = (appointment) => {
        if (!appointment?.date) return 'TBD';

        const date = new Date(appointment.date);
        if (Number.isNaN(date.getTime())) return 'TBD';

        const time = appointment.time_start
            ? new Date(`1970-01-01T${appointment.time_start}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : '';

        return time ? `${date.toLocaleDateString()} • ${time}` : date.toLocaleDateString();
    };
    useEffect(() => {
        if (currentOrder?.order_measurements) {
            const pending = currentOrder.order_measurements.filter((measurement) => !measurement.measurement_value);

            // Only initialize when the local state is empty or the backend request set changes.
            if (customerMeasurements.length === 0 || customerMeasurements.length !== pending.length) {
                setCustomerMeasurements(
                    pending.map((measurement) => ({
                        name: measurement.measurement_name,
                        instruction: measurement.instruction || '',
                        value: measurement.measurement_value || '',
                        unit: measurement.unit || lockedMeasurementUnit,
                    }))
                );
            }
        }
    }, [currentOrder?.order_measurements, lockedMeasurementUnit]);

    useEffect(() => {
        if (!reworkSubmissionSignal) return;

        setReworkReasonCategory('Fit Issue');
        setReworkCustomerNotes('');
        setReworkProofImages([]);
        setReworkProofError('');
        setIsReworkDragActive(false);
        setShowReworkModal(true);
    }, [reworkSubmissionSignal]);

    const submitReworkRequest = () => {
        if (!reworkCustomerNotes.trim()) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Please add notes describing the alteration/rework needed.', type: 'error' });
            return;
        }

        if (reworkProofError) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: reworkProofError, type: 'error' });
            return;
        }

        setIsSubmittingRework(true);
        router.post(`/my-orders/${currentOrder.id}/rework`, {
            reason_category: reworkReasonCategory,
            customer_notes: reworkCustomerNotes,
            proof_images: reworkProofImages,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmittingRework(false);
                setShowReworkModal(false);
                setReworkCustomerNotes('');
                setReworkProofImages([]);
            },
            onError: () => {
                setIsSubmittingRework(false);
            },
        });
    };

    const addReworkFiles = (files) => {
        const { validFiles, errorMessage } = filterImageFiles(files);

        if (errorMessage) {
            setReworkProofError(errorMessage);
        }

        if (!validFiles.length) {
            return;
        }

        setReworkProofError('');
        setReworkProofImages((prev) => [...prev, ...validFiles]);
    };

    const removeReworkFile = (indexToRemove) => {
        setReworkProofImages((prev) => {
            const next = prev.filter((_, index) => index !== indexToRemove);
            if (!next.length) {
                setReworkProofError('');
            }
            return next;
        });
    };

    

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Specs, Design & Itemized List */}
            <div className="lg:col-span-2 space-y-8">

                <section ref={reworkRef} tabIndex={-1} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm outline-none">
                    <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] mb-2">Post-Completion Rework</h3>
                    {reworkRequest ? (
                        <div>
                            <p className="text-lg font-black text-stone-900">
                                {reworkStatus === 'pending review' ? 'Pending Review' : reworkStatus === 'accepted' ? 'Fix in Progress' : reworkStatus === 'resolved' ? 'Resolved' : `Rework ${reworkRequest.status}`}
                            </p>
                            <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Category:</span> {reworkRequest.reason_category}</p>
                            <p className="text-sm text-stone-700 mt-1"><span className="font-bold">Your Notes:</span> {reworkRequest.customer_notes}</p>

                            {reworkStatus === 'pending review' && (
                                <p className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800">
                                    Tailor is reviewing your request.
                                </p>
                            )}
                            {reworkStatus === 'accepted' && (
                                <p className="mt-4 rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-800">
                                    Item is back at the shop for repairs.
                                </p>
                            )}
                            {reworkStatus === 'resolved' && (
                                <p className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800">
                                    Ready! You can pick up your item.
                                </p>
                            )}

                            {!!reworkRequest?.proof_images?.length && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {reworkRequest.proof_images.map((img, idx) => (
                                        <img
                                            key={`customer-rework-proof-${idx}`}
                                            src={img?.startsWith('http') ? img : `/storage/${img}`}
                                            alt="Rework proof"
                                            className="w-full h-24 object-cover rounded-xl border border-amber-200 bg-white"
                                        />
                                    ))}
                                </div>
                            )}

                            {reworkRequest.tailor_response_notes && (
                                <p className="text-sm text-stone-700 mt-4"><span className="font-bold">Tailor Response:</span> {reworkRequest.tailor_response_notes}</p>
                            )}
                        </div>
                    ) : (currentOrder.status?.name || currentOrder.status) === 'Completed' ? (
                        <div>
                            <p className="text-sm text-stone-700 mb-4">Need a minor alteration after completion? You can request a separate rework process without changing the completed order.</p>
                            <button
                                type="button"
                                onClick={() => setShowReworkModal(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                            >
                                Request Alteration / Rework
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-stone-600">Rework requests become available only after the order is completed.</p>
                    )}
                </section>

                {/* Design Context Section */}
                <section>
                    <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Design Context</h3>
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                        {/* Design Image */}
                        <div className="w-full md:w-1/3 aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border border-stone-200">
                            {currentOrder.design_image ? (
                                <img src={`/storage/${currentOrder.design_image}`} alt="Design Reference" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                                    <Camera className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-xs font-medium uppercase tracking-wider">No Image Provided</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Context Details */}
                        <div className="flex-1 space-y-6">
                            {currentOrder.rush_order && (
                                <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Rush Order</span>
                                    <span className="inline-block px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-black shadow-sm">
                                        Rush requested by customer
                                    </span>
                                </div>
                            )}
                            
                            {currentOrder.notes && (
                                <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Customer Notes</span>
                                    <p className="text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200 shadow-sm">
                                        {currentOrder.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Materials & Specifications */}
                <section>
                    <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">
                        Materials & Specifications
                    </h3>
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                        
                        <div>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-4">
                                Materials You Availed (Shop Provided)
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentOrder.items && currentOrder.items.length > 0 ? (
                                    currentOrder.items.map((item, idx) => {
                                        // 1. Identify the core Shop Attribute ID
                                        const shopAttrId = item.pivot?.shop_attribute_id || item.shop_attribute_id || item.id;

                                        // 2. Cross-reference the live catalog to get the real names
                                        const catalogItem = availableShopAttributes?.find(a => a.pivot?.id === shopAttrId || a.id === shopAttrId);

                                        // 3. Extract the math
                                        const qty = Number(item.quantity || item.pivot?.quantity || 1);
                                        const unitPrice = Number(item.price || item.pivot?.price || catalogItem?.pivot?.price || catalogItem?.price || 0);
                                        const totalPrice = qty * unitPrice;

                                        // 4. Extract the display names
                                        let displayName = catalogItem?.pivot?.item_name || catalogItem?.item_name || item.shopAttribute?.item_name || catalogItem?.name || item.shopAttribute?.attribute?.name || 'Shop Item';
                                        let categoryName = catalogItem?.attributeCategory?.name || catalogItem?.attribute_category?.name || item.shopAttribute?.attribute?.attributeCategory?.name || 'Add-on';
                                        const unit = catalogItem?.pivot?.unit || catalogItem?.unit || item.unit || item.pivot?.unit || 'unit';

                                        // 5. Clean up redundant double-names
                                        if (displayName.includes(' - ')) {
                                            const parts = displayName.split(' - ');
                                            if (parts[0].trim() === parts[1].trim()) displayName = parts[0].trim();
                                        }

                                        if (displayName === categoryName) {
                                            categoryName = 'Add-on';
                                        }

                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 bg-gradient-to-r from-emerald-50/40 to-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-150">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5 block">
                                                        {categoryName}
                                                    </div>
                                                    <div className="font-bold text-slate-900 text-base leading-tight mb-1.5 truncate">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-xs font-semibold tracking-wider leading-relaxed">
                                                        {unitPrice > 0 ? (
                                                            <div className="text-emerald-700">
                                                                ₱{unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})} per {unit} × {qty}
                                                            </div>
                                                        ) : (
                                                            <div className="text-amber-700 font-bold bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/50 inline-block">
                                                                Pending Quote
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {unitPrice > 0 && (
                                                    <div className="flex items-baseline gap-2 sm:justify-end">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Total</span>
                                                        <span className="font-black text-emerald-700 text-2xl leading-none">
                                                            ₱{totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-stone-50 border border-stone-200 border-dashed rounded-xl p-6 text-center">
                                        <p className="text-sm font-medium text-stone-500">No materials or specifications have been added to this order.</p>
                                    </div>
                                )}
                            </div>

                            {/* Tailor Requirements */}
                            {currentOrder.required_materials?.length > 0 && (
                                <div className="pt-6 border-t border-stone-100">
                                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-4">
                                        {currentOrder.material_source === 'customer' 
                                            ? 'Materials We Expect You Will Be Bringing' 
                                            : 'Additional Materials Billed by Tailor'}
                                    </p>
                                    <div className="flex flex-col gap-3">
{currentOrder.required_materials.map((req, idx) => {
                                            const qty = Number(req.quantity || 1);
                                            const unitPrice = Number(req.price || 0);
                                            const lineTotal = unitPrice * qty;
                                            const unit = req.unit || 'unit';
                                            
                                            const rawImage = req.image_url || req.pivot?.image_url;
                                            const imageUrl = rawImage 
                                                ? (rawImage.startsWith('http') || rawImage.startsWith('/storage') ? rawImage : `/storage/${rawImage}`) 
                                                : null;
                                            
                                            const displayName = req.material_name || req.name || 'Unnamed Material';
                                            const displayCategory = req.category || 'Added Material';

                                            return (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm gap-4">
                                                    <div className="flex items-center gap-4">
                                                        {imageUrl ? (
                                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-indigo-100 flex-shrink-0 border border-indigo-200">
                                                                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0 text-indigo-300 text-xs font-black">
                                                                N/A
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">
                                                                {displayCategory}
                                                            </span>
                                                            <span className="text-sm font-bold text-indigo-800 block mb-1">
                                                                {displayName}
                                                            </span>
                                                            {req.notes && (
                                                                <span className="text-[10px] font-medium text-indigo-500 block mb-1 italic">
                                                                    Note: {req.notes}
                                                                </span>
                                                            )}
                                                            {unitPrice > 0 ? (
                                                                <span className="text-xs text-indigo-600 font-bold">
                                                                    ₱{unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})} / {unit} <span className="text-indigo-400 font-medium">× {qty}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 inline-block">
                                                                    {qty} {unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {unitPrice > 0 && (
                                                        <span className="text-base font-black text-indigo-600 flex-shrink-0">
                                                            ₱{lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

{/* Measurement Section */}
{fitMethodName !== 'No Measurement Required' && (
    <div className="space-y-6">
        {/* State 1: Pending (Self-Measured) */}
        {hasPendingMeasurements && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 shadow-sm">
                <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] mb-2">Pending Measurements</h3>
                <p className="text-sm text-amber-700 mb-4">Please provide the following measurements to finalize your quote.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {pendingMeasures.map((measure, idx) => (
                        <div key={`pending-${idx}`}>
                            <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-2">{measure.measurement_name}</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.1" placeholder="0.0"
                                    value={customerMeasurements.find(m => m.name === measure.measurement_name)?.value || ''}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setCustomerMeasurements(prev => prev.map(m => m.name === measure.measurement_name ? { ...m, value: newValue } : m));
                                    }}
                                    className="w-full rounded-lg border border-stone-200 shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 font-bold bg-white"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-amber-600 font-bold text-xs">{lockedMeasurementUnitLabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        const hasEmpty = customerMeasurements.some(m => !m.value || Number(m.value) <= 0);
                        if (hasEmpty) {
                            showAlert({
                                title: 'Validation Error',
                                message: 'Please fill all measurements with valid values.',
                                type: 'error',
                            });
                            return;
                        }

                        const submitted = customerMeasurements.map(m => ({
                            name: m.name,
                            value: m.value,
                            unit: lockedMeasurementUnit,
                            measurements_taken: true
                        }));

                        router.patch(`/my-orders/${currentOrder.id}/measurements`, {
                            submitted_measurements: submitted,
                            unit: lockedMeasurementUnit
                        }, { 
                            preserveScroll: true,
                            onStart: () => setIsSubmitting(true),
                            onFinish: () => setIsSubmitting(false),
                            onSuccess: () => {
                                setSubmitSuccess(true);
                                setTimeout(() => setSubmitSuccess(false), 3000);
                                router.reload({ preserveState: false, preserveScroll: true });
                            }
                        });
                    }}
                    disabled={isSubmitting || submitSuccess}
                    className={`mt-4 w-full sm:w-auto px-8 py-3 font-black rounded-xl transition-colors shadow-md ${submitSuccess ? 'bg-emerald-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                >
                    {submitSuccess ? (<><Check className="w-4 h-4 inline-block mr-2" />Measurements Submitted</>) : (isSubmitting ? 'Submitting...' : 'Submit Measurements')}
                </button>
            </div>
        )}

        {/* State 2: Pending (In-Shop / Home Visit) */}
        {completedMeasures.length === 0 && ['In-Shop Fitting', 'Home Visit'].includes(fitMethodName) && (
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 shadow-sm flex flex-col items-center justify-center text-center">
                <Ruler className="w-12 h-12 text-blue-300 mb-3" />
                <h3 className="font-black text-blue-900 mb-1 text-lg">Measurements Pending Appointment</h3>
                <p className="text-sm text-blue-700 max-w-md mb-4">
                    Your measurements will be professionally taken and recorded here by the tailor during your scheduled visit.
                </p>
                
                {/* Conditional Appointment Reminder */}
                {fittingAppointment && fittingAppointment.date ? (
                    <div className="bg-white px-5 py-3 rounded-xl border border-blue-100 shadow-sm inline-flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Scheduled Date</span>
                        <span className="text-base font-bold text-blue-900">
                            {formatAppointment(fittingAppointment)}
                        </span>
                    </div>
                ) : (
                    <div className="bg-amber-100/50 px-5 py-3 rounded-xl border border-amber-200 inline-flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-800">Appointment scheduling pending...</span>
                    </div>
                )}
            </div>
        )}

        {/* State 3: Completed (Read-Only Grid for ALL methods) */}
        {completedMeasures.length > 0 && (
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[11px] font-black text-stone-700 uppercase tracking-[0.2em]">Recorded Measurements</h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md uppercase tracking-wider">Saved to Profile</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedMeasures.map((measure, idx) => (
                        <div key={`completed-${idx}`} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                            <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider block mb-1">{measure.measurement_name || measure.name}</span>
                            <span className="text-xl font-black text-slate-800">{measure.measurement_value || measure.value} <span className="text-sm text-stone-500 font-normal">{measure.unit || lockedMeasurementUnitLabel}</span></span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
)}

            </div>

            {/* Right Column: Invoice & Logistics */}
            <div className="space-y-6">
                {/* Final Invoice */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 shadow-xl text-white relative overflow-hidden">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <TbCurrencyPeso className="w-6 h-6 text-emerald-400" />
                        Final Invoice
                    </h3>
                    <div className="space-y-4 text-sm font-medium text-stone-300">
                        
                        {/* Base Labor */}
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs uppercase tracking-wider opacity-80">Base Labor</span>
                            <span className="text-base font-bold text-white">
                                ₱{baseLabor.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>

                        {currentOrder.rush_order && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs uppercase tracking-wider text-rose-300">Rush Surcharge</span>
                                <span className="text-base font-bold text-rose-300">
                                    + ₱{rushFee.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        )}
                        
                        {/* Customer's Initial Items */}
                        {initialItemsTotal > 0 && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs uppercase tracking-wider opacity-80">Initial Items</span>
                                <span className="text-base font-bold text-white">
                                    ₱{initialItemsTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        )}
                        
                        {/* Tailor's Added Materials */}
                        {addedMaterialsTotal > 0 && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs uppercase tracking-wider text-indigo-400 opacity-90">Added Materials</span>
                                <span className="text-base font-bold text-indigo-400">
                                    + ₱{addedMaterialsTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="border-t border-stone-700 pt-4 mt-4 flex justify-between items-end">
                            <span className="text-sm font-black text-stone-100 uppercase tracking-widest">Grand Total</span>
                            <span className="text-3xl font-black text-emerald-400">
                                ₱{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                </div>

                <PaymentSection
                    currentOrder={currentOrder}
                    totalAmount={grandTotal}
                    amountPaid={amountPaid}
                    remainingBalance={remainingBalance}
                    onPrintReceipt={() => generateReceipt(currentOrder, availableShopAttributes)}
                    paymentStatusRaw={paymentStatusRaw}
                />

                {/* Moved Review & Accept Quote Block */}
                {((currentOrder.status?.name || currentOrder.status) === 'Quoted') && !['Partial', 'Paid'].includes(paymentStatusRaw) && !currentOrder.manual_payment_reference_id && !currentOrder.manual_payment_proof_path && !currentOrder.paymongo_payment_id && (
                    <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl border border-orchid-200 shadow-lg shadow-orchid-100">
                        <div className="mb-6 border-b border-stone-100 pb-6">
                            <h3 className="text-xl font-black text-orchid-800 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-6 h-6" />
                                Review & Accept Quote
                            </h3>
                            <p className="text-sm text-stone-600">
                                The tailor has reviewed your request. Please review the final invoice above and confirm below. Measurements will be requested if needed.
                            </p>
                        </div>

                        {rejectionReason && !currentOrder.manual_payment_proof_path && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
                                    <div>
                                        <p className="text-sm font-black text-rose-900">Payment Proof Rejected</p>
                                        <p className="mt-1 text-xs text-rose-700">{rejectionReason}</p>
                                        <p className="mt-2 text-xs font-bold text-rose-800">Please upload a new payment proof.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPaymentUnderReview ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center gap-3">
                                    <Clock3 className="h-6 w-6 animate-pulse text-amber-500" />
                                    <div>
                                        <p className="text-sm font-black text-amber-900">Payment Verifying</p>
                                        <p className="text-xs text-amber-700">The tailor is reviewing your payment proof. This usually takes a few hours.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-2 pt-2">                          
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e?.preventDefault();
                                    setIsPaymentModalOpen(true);
                                }}
                                disabled={isAcceptingQuote}
                                className={`flex-1 py-4 font-black text-lg rounded-xl transition-all duration-200 shadow-md disabled:cursor-not-allowed ${
                                    isAcceptingQuote
                                        ? 'bg-stone-300 text-stone-600 shadow-stone-200/60'
                                        : 'bg-indigo-600 hover:bg-orchid-700 text-white shadow-orchid-200/50 hover:shadow-lg'
                                }`}
                            >
                                {isAcceptingQuote ? 'Processing...' : 'Accept Quote & Proceed'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsDeclineModalOpen(true)}
                                className="px-6 py-4 bg-white text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-50 transition-all duration-200 shadow-sm"
                            >
                                Decline
                            </button>
                            </div>
                        )}
                        {/* Measurement requirement removed: customers can accept and pay without saved measurements. */}
                    </div>
                )}

                {isDeclineModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) { setIsDeclineModalOpen(false); } }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Decline Quote</h2>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <p className="text-sm text-stone-600 font-medium">
                                    Please select one reason for declining this quote.
                                </p>

                                <div className="space-y-3">
                                    {declineReasons.map((reason, idx) => (
                                        <label key={`decline-reason-${idx}`} className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${declineReason === reason ? 'border-rose-500 bg-rose-50' : 'border-stone-200 hover:border-rose-200'}`}>
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="customer-decline-reason"
                                                    value={reason}
                                                    checked={declineReason === reason}
                                                    onChange={(e) => setDeclineReason(e.target.value)}
                                                    className="mt-1 text-rose-600 focus:ring-rose-500"
                                                />
                                                <span className="block text-sm text-stone-700">{reason}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeclineModalOpen(false);
                                        setDeclineReason('');
                                    }}
                                    className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!declineReason || isDecliningQuote}
                                    onClick={() => {
                                        setIsDecliningQuote(true);
                                        router.patch(`/my-orders/${currentOrder.id}/decline`, { reason: declineReason }, {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setIsDecliningQuote(false);
                                                setIsDeclineModalOpen(false);
                                                setDeclineReason('');
                                            },
                                            onError: () => {
                                                setIsDecliningQuote(false);
                                            }
                                        });
                                    }}
                                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    {isDecliningQuote ? 'Submitting...' : 'Confirm Decline'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    currentOrder={currentOrder}
                    shop={shop}
                    totalAmount={grandTotal}
                    downpaymentAmount={downpaymentAmount}
                    onConfirmOrder={onAcceptQuote}
                />

                {showReworkModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowReworkModal(false); } }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-stone-100">
                                <h2 className="text-xl font-black text-slate-800">Request Alteration / Rework</h2>
                                <p className="text-sm text-stone-500 mt-1">This request is tracked separately and does not change your completed order status.</p>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Reason Category</label>
                                    <select
                                        value={reworkReasonCategory}
                                        onChange={(e) => setReworkReasonCategory(e.target.value)}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm font-semibold"
                                    >
                                        <option value="Fit Issue">Fit Issue</option>
                                        <option value="Defect">Defect</option>
                                        <option value="Material Issue">Material Issue</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Notes</label>
                                    <textarea
                                        value={reworkCustomerNotes}
                                        onChange={(e) => setReworkCustomerNotes(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm"
                                        placeholder="Describe the specific alteration or issue that needs attention."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Proof Images (Optional)</label>
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsReworkDragActive(true);
                                        }}
                                        onDragLeave={() => setIsReworkDragActive(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsReworkDragActive(false);
                                            addReworkFiles(e.dataTransfer.files);
                                        }}
                                        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                                            isReworkDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300 bg-stone-50'
                                        }`}
                                    >
                                        <p className="text-sm font-semibold text-stone-700">Drag and drop proof images here</p>
                                        <p className="text-xs text-stone-500 mt-1">or select multiple files</p>
                                        <label className="inline-flex mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold cursor-pointer hover:bg-indigo-700">
                                            Choose Images
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => addReworkFiles(e.target.files)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {reworkProofError && <p className="mt-3 text-xs font-semibold text-rose-600">{reworkProofError}</p>}

                                    {reworkProofImages.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {reworkProofImages.map((file, idx) => (
                                                <div key={`${file.name}-${idx}`} className="relative rounded-xl border border-stone-200 bg-white p-2">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="h-24 w-full object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReworkFile(idx)}
                                                        className="mt-2 w-full rounded-md bg-rose-100 text-rose-700 text-xs font-bold py-1.5 hover:bg-rose-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReworkModal(false)}
                                    className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitReworkRequest}
                                    disabled={isSubmittingRework || Boolean(reworkProofError)}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {isSubmittingRework ? 'Submitting...' : 'Submit Rework Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Measurement Modal */}
{false && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-6 border-b border-stone-100 bg-stone-50">
                                <h3 className="text-xl font-black text-slate-800">Required Measurements</h3>
                                <p className="text-sm text-stone-500 mt-1">Please provide the specific measurements requested by the tailor to confirm your order.</p>
                            </div>
                            
                            {/* Body (Scrollable) */}
                            <div className="p-6 overflow-y-auto space-y-4">
                                {customerMeasurements.map((measure, idx) => (
                                    <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <span className="font-bold text-slate-800 block">{measure.name}</span>
                                                {measure.instruction && (
                                                    <span className="text-xs text-stone-500 italic block mt-1">{measure.instruction}</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={measure.value || ''}
                                                    onChange={(e) => {
                                                        const newM = [...customerMeasurements];
                                                        newM[idx].value = e.target.value;
                                                        setCustomerMeasurements(newM);
                                                    }}
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm focus:ring-orchid-500 focus:border-orchid-500 font-bold"
                                                    placeholder={`Enter value`}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-stone-400 font-bold text-sm uppercase">{lockedMeasurementUnitLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Footer */}
                            <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-4">
                                <button 
                                    onClick={() => setIsMeasurementModalOpen(false)}
                                    className="flex-1 py-3 bg-white text-stone-600 font-bold rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        const hasEmpty = customerMeasurements.some(m => !m.value || Number(m.value) <= 0);
                                        if (hasEmpty) {
                                            showAlert({
                                                title: 'Validation Error',
                                                message: 'Please fill all measurements with valid values.',
                                                type: 'error',
                                            });
                                            return;
                                        }
                                        setIsMeasurementModalOpen(false);
                                        onAcceptQuote();
                                    }}
                                    disabled={isAcceptingQuote}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-orchid-700 transition-colors shadow-md shadow-orchid-200 disabled:opacity-50"
                                >
                                    {isAcceptingQuote ? 'Submitting...' : 'Submit Measurements & Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Logistics */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                
                    <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Project Logistics</h3>
                    <div className="space-y-4">

        {/* 0. Production Timeline */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Production Timeline</p>
            {hasExpectedCompletionDate ? (
                <p className="text-sm font-bold text-slate-800">
                    Target Completion Date: {new Date(currentOrder.expected_completion_date).toLocaleDateString()}
                </p>
            ) : hasLeadTimeEstimate ? (
                <p className="text-sm font-medium text-stone-700 leading-relaxed">
                    Estimated completion: {Math.max(1, productionMinDays)}-{productionMaxDays} working days. Production begins once materials are received and measurements are recorded. The exact date of work starts.
                </p>
            ) : (
                <p className="text-sm text-stone-500">Production timeline will be available once the tailor submits the quote.</p>
            )}
        </div>
        
        {/* 1. Appointment Schedule */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Appointment Schedule</p>
            {orderAppointments.length > 0 ? (
                <div className="space-y-2">
                    {orderAppointments.map((appointment, index) => (
                        <div key={appointment.id || `${appointment.date}-${index}`} className="flex justify-between items-center rounded-xl bg-white border border-stone-200 px-3 py-2 shadow-sm gap-4">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                {index === 0 ? 'Appointment' : `Appointment ${index + 1}`}
                            </span>
                            <span className="text-xs font-bold text-stone-700 text-right">{formatAppointment(appointment)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-amber-600 mt-2 font-medium">Appointment schedule to be arranged.</p>
            )}
        </div>

        {/* 2. Fit Method */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Fit Method</p>
            <p className="text-sm font-bold text-slate-800">{fitMethodName}</p>

            <div className="mt-4 pt-4 border-t border-stone-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1">
                    Location
                </span>
                {fitMethodName === 'Home Visit' ? (
                    <div>
                        <p className="font-bold text-slate-800">Your Home Address</p>
                        <p className="text-sm text-slate-600">{customerAddress}</p>
                        <span className="inline-block mt-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Staff will visit you</span>
                        <button
                            type="button"
                            onClick={handleViewMap}
                            className="mt-2 w-full py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-4 h-4" /> View on Map
                        </button>
                    </div>
                ) : fitMethodName === 'In-Shop Fitting' ? (
                    <div>
                        <p className="font-bold text-slate-800">Shop Address</p>
                        <p className="text-sm text-slate-600">{shopAddress}</p>
                        <span className="inline-block mt-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Please visit the shop</span>
                        <button
                            type="button"
                            onClick={handleViewMap}
                            className="mt-2 w-full py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-4 h-4" /> View on Map
                        </button>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-slate-600">Online / Remote (No visit required)</p>
                )}
            </div>
        </div>

        

        {/* 3. Service Category */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Service Category</p>
            <p className="text-sm font-bold text-orchid-600">
                {currentOrder.orderServices?.[0]?.service?.serviceCategory?.name || currentOrder.orderServices?.[0]?.service?.service_category?.name || 'Custom Service'}
            </p>
        </div>
        
    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;

function PaymentSection({
    currentOrder,
    totalAmount,
    amountPaid,
    remainingBalance,
    onPrintReceipt,
    paymentStatusRaw,
}) {
    const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);
    const paymentStatus = paymentStatusRaw;
    const isPartialPayment = paymentStatus === 'Partial';
    const isFullPayment = paymentStatus === 'Paid';
    const manualProofPath = currentOrder?.manual_payment_proof_path || null;
    const manualProofUrl = manualProofPath
        ? (manualProofPath.startsWith('http') ? manualProofPath : `/storage/${manualProofPath}`)
        : null;
    const manualReferenceId = currentOrder?.manual_payment_reference_id || '';
    const isCashIntent = manualReferenceId === 'CASH-INTENT';
    const hasManualPaymentProof = Boolean(manualProofUrl || manualReferenceId);
    const isManualVerifying = !isPartialPayment && !isFullPayment && hasManualPaymentProof && !isCashIntent;
    const isCashVerifying = !isPartialPayment && !isFullPayment && isCashIntent;

    const rawStatus = (currentOrder.status?.name || currentOrder.status || 'Requested').toString().trim().toLowerCase();
    const statusRank = {
        requested: 0,
        quoted: 1,
        confirmed: 2,
        'appointment scheduled': 3,
        'ready for production': 4,
        'in progress': 5,
        'ready to pick up': 6,
        'ready for pickup': 6,
        completed: 7,
    };
    const isAtLeastQuoted = (statusRank[rawStatus] ?? 0) >= statusRank.quoted;

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

    if (!isPartialPayment && !isFullPayment && !hasManualPaymentProof) {
        return null;
    }

    return (
            <div id="payment-receipt" className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 md:p-8 shadow-lg shadow-emerald-100">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2 text-emerald-900">
                            <CheckCircle className="w-6 h-6" />
                            {isCashVerifying ? 'Paying In-Shop (Cash)' : isManualVerifying ? 'Manual Payment Submitted' : (isPartialPayment ? 'Partial Payment Secured' : 'Fully Funded')}
                        </h3>
                        <p className="text-sm mt-1 text-emerald-700">
                            {isCashVerifying
                                ? 'Your order is confirmed. Please settle your payment at the counter during your visit.'
                                : isManualVerifying
                                ? 'Your transfer proof is submitted and currently under review by the shop.'
                                : isFullPayment
                                ? 'Your order is fully funded.'
                                : 'Your initial payment is safely locked while production proceeds.'}
                        </p>
                    </div>
                    
                    {/* Only show Print if the order is Quoted AND they have selected a valid payment path */}
                    {isAtLeastQuoted && (isPartialPayment || isFullPayment || isCashIntent) && (
                        <button 
                            onClick={onPrintReceipt} 
                            className="p-2 bg-white rounded-lg border border-emerald-200 transition-all duration-200 hover:bg-stone-100 shadow-sm" 
                            title="Print Invoice / Receipt"
                        >
                            <Printer className="w-5 h-5 text-emerald-600" />
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: isFullPayment ? '#d0d8c4' : '#fcd34d' }}>
                    <div className="border-b border-stone-100 pb-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Order ID</div>
                                <div className="font-bold text-stone-900">#{currentOrder.id}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Shop</div>
                                <div className="font-bold text-stone-900">{currentOrder.tailoring_shop?.shop_name || currentOrder.tailoringShop?.shop_name || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {!isManualVerifying && !isCashVerifying && (
                        <div className="border-b border-stone-100 pb-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-stone-600">Payment Type:</span>
                                    <span className="font-bold text-stone-900 capitalize">
                                        {isFullPayment ? 'Full Payment' : '50% Downpayment'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-stone-200 pb-3">
                                    <span className="text-sm text-stone-600 font-semibold">Total Amount:</span>
                                    <span className="text-xl font-black text-stone-900">
                                        ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline text-emerald-600">
                                    <span className="text-sm font-bold">Amount Paid:</span>
                                    <span className="text-lg font-black">
                                        ₱{amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {remainingBalance > 0 && (
                                    <div className="flex justify-between items-baseline p-3 rounded-lg -mx-2 bg-emerald-100">
                                        <span className="text-sm font-bold text-emerald-900">
                                            Remaining Balance:
                                        </span>
                                        <span className="font-black text-base text-emerald-800">
                                            ₱{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {isPartialPayment && (
                                    <p className="text-xs text-amber-700 font-semibold italic pt-2 border-t border-amber-200 inline-flex items-center gap-1.5">
                                        <Info className="h-4 w-4" />
                                        The remaining balance will be collected upon completion of your order.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manual Transfer Proof Section (Only show if NOT cash intent) */}
                    {hasManualPaymentProof && !isCashIntent && (
                        <div className="border-b border-stone-100 pb-4 space-y-3">
                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Manual Payment Proof</div>

                            {manualReferenceId && (
                                <p className="text-sm text-stone-700">
                                    <span className="font-bold">Reference ID:</span>{' '}
                                    <span className="font-mono bg-white px-2 py-1 rounded border border-stone-200">{manualReferenceId}</span>
                                </p>
                            )}

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
                                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/25 transition-colors" />
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
                                <p className="text-sm font-semibold text-rose-700">No proof image uploaded.</p>
                            )}
                        </div>
                    )}

                    {/* Cash Intent Notification Section */}
                    {isCashIntent && !isFullPayment && !isPartialPayment && (
                        <div className="border-b border-stone-100 pb-4 space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <Wallet className="h-6 w-6 text-amber-700" />
                                <div className="flex-1">
                                    <p className="font-bold text-amber-900">Cash Payment Selected</p>
                                    <p className="text-sm text-amber-800 mt-1">Please prepare the exact amount for your visit. The tailor will update this status once they receive your payment.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentOrder.paymongo_payment_id && (
                        <div className="bg-stone-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Gateway Reference</div>
                            <div className="font-mono text-xs text-stone-600 break-all bg-white p-2 rounded border border-stone-200">{currentOrder.paymongo_payment_id}</div>
                            <p className="text-[10px] text-stone-500 mt-2 italic">This reference proves the authenticity of your transaction.</p>
                        </div>
                    )}
                </div>

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
            </div>
        );
}

