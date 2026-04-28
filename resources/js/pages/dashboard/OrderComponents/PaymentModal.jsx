import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CreditCard, Gift, Loader, X } from 'lucide-react';
import AlertModal from '@/Components/AlertModal';
import { showAlert } from '@/utils/alert';
import { getImageUploadError } from '@/utils/imageUpload';

const PaymentModal = ({
    isOpen,
    onClose,
    currentOrder,
    shop,
    totalAmount,
    downpaymentAmount,
}) => {
    const [paymentMethod, setPaymentMethod] = useState('paymongo');
    const [selectedPaymentType, setSelectedPaymentType] = useState(null);
    const [referenceId, setReferenceId] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [paymentProofError, setPaymentProofError] = useState('');
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        if (!isOpen) {
            setPaymentMethod('paymongo');
            setSelectedPaymentType(null);
            setReferenceId('');
            setPaymentProof(null);
            setPaymentProofError('');
            setIsPaymentProcessing(false);
            setPaymentError(null);
        }
    }, [isOpen]);

    if (!isOpen || !currentOrder) {
        return null;
    }

    const handlePaymentProofChange = (file) => {
        if (!file) {
            setPaymentProof(null);
            setPaymentProofError('');
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setPaymentProof(null);
            setPaymentProofError(error);
            return;
        }

        setPaymentProof(file);
        setPaymentProofError('');
    };

    const handleRequestPayment = async () => {
        if (!selectedPaymentType) {
            setAlert({
                isOpen: true,
                title: 'Payment Error',
                message: 'Please select a payment option.',
                type: 'error',
            });
            return;
        }

        if (paymentMethod === 'manual') {
            if (!referenceId.trim()) {
                setAlert({
                    isOpen: true,
                    title: 'Manual Transfer Error',
                    message: 'Please enter the transfer reference ID.',
                    type: 'error',
                });
                return;
            }

            if (!paymentProof) {
                setAlert({
                    isOpen: true,
                    title: 'Manual Transfer Error',
                    message: 'Please upload a payment screenshot proof.',
                    type: 'error',
                });
                return;
            }

            if (paymentProofError) {
                setAlert({
                    isOpen: true,
                    title: 'Manual Transfer Error',
                    message: paymentProofError,
                    type: 'error',
                });
                return;
            }
        }

        setIsPaymentProcessing(true);
        setPaymentError(null);

        try {
            await axios.patch(`/my-orders/${currentOrder.id}/accept`, {});

            if (paymentMethod === 'manual') {
                const payload = new FormData();
                payload.append('payment_type', selectedPaymentType);
                payload.append('reference_id', referenceId.trim());
                payload.append('payment_proof', paymentProof);

                await axios.post(`/orders/${currentOrder.id}/manual-payment`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                onClose?.();
                showAlert({
                    title: 'Payment Submitted',
                    message: 'Your payment proof has been sent to the tailor for verification.',
                    type: 'success',
                });
                return;
            }

            const response = await axios.post('/payments/generate', {
                order_id: currentOrder.id,
                payment_type: selectedPaymentType,
            });

            if (response.data?.checkout_url) {
                window.location.href = response.data.checkout_url;
                return;
            }

            throw new Error('Payment link was not generated.');
        } catch (error) {
            console.error('Payment Flow Error:', error.response || error);
            setAlert({
                isOpen: true,
                title: 'Payment Error',
                message: error.response?.data?.message || 'An error occurred while connecting to the payment gateway.',
                type: 'error',
            });
            setPaymentError(error.response?.data?.message || error.message || 'Failed to generate payment link');
        } finally {
            setIsPaymentProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/60 backdrop-blur-sm p-4 py-6">
            <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-5 md:p-8 shadow-2xl shadow-indigo-200/70">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2 mb-2">
                            <CreditCard className="w-6 h-6" />
                            Confirm Quote and Pay
                        </h3>
                        <p className="text-sm text-indigo-700">Confirm the quote first, then choose how you want to pay.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-white p-2 text-indigo-700 hover:bg-indigo-100"
                        aria-label="Close payment modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 bg-white rounded-2xl p-4 border border-indigo-100">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-stone-600">Total Amount:</span>
                        <span className="text-2xl font-black text-indigo-600">
                            ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 text-sm text-indigo-800">
                    Choose your preferred payment path: PayMongo checkout or manual QR transfer.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('paymongo')}
                        className={`p-3 rounded-2xl border-2 font-black transition ${
                            paymentMethod === 'paymongo'
                                ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                                : 'border-stone-200 bg-white text-stone-700 hover:border-indigo-300'
                        }`}
                    >
                        Pay via PayMongo
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('manual')}
                        className={`p-3 rounded-2xl border-2 font-black transition ${
                            paymentMethod === 'manual'
                                ? 'border-emerald-600 bg-emerald-100 text-emerald-900'
                                : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300'
                        }`}
                    >
                        Manual QR Transfer
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <button
                        type="button"
                        onClick={() => setSelectedPaymentType('full')}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                            selectedPaymentType === 'full'
                                ? 'border-indigo-600 bg-indigo-100'
                                : 'border-stone-200 bg-white hover:border-indigo-300'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                                selectedPaymentType === 'full' ? 'border-indigo-600 bg-indigo-600' : 'border-stone-300'
                            }`}>
                                {selectedPaymentType === 'full' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-stone-900">Pay Full Amount</div>
                                <div className="text-sm text-stone-600 mt-1">
                                    Pay ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now
                                </div>
                                <div className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                                    Complete Payment
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedPaymentType('partial')}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                            selectedPaymentType === 'partial'
                                ? 'border-amber-600 bg-amber-100'
                                : 'border-stone-200 bg-white hover:border-amber-300'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                                selectedPaymentType === 'partial' ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                            }`}>
                                {selectedPaymentType === 'partial' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-stone-900 flex items-center gap-2">
                                    <Gift className="w-4 h-4" /> 50% Downpayment
                                </div>
                                <div className="text-sm text-stone-600 mt-1">
                                    Pay ₱{downpaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now
                                </div>
                                <div className="text-xs text-amber-600 font-bold mt-2 bg-amber-50 px-2 py-1 rounded-lg inline-block">
                                    Remaining: ₱{downpaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {paymentMethod === 'manual' && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5 space-y-6">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Manual Transfer Details</p>
                            <p className="mt-1 text-sm text-stone-700">
                                {shop?.payout_method || 'Payment Method'}: <span className="font-bold">{shop?.payout_account || 'Not configured'}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8 items-start">
                            <div className="bg-emerald-100 text-emerald-900 px-6 py-4 rounded-xl font-bold text-base flex flex-col gap-1 md:flex-row md:justify-between md:items-center shadow-inner border border-emerald-300">
                                <span>GCash</span>
                                <span className="font-mono text-xl tracking-tight">09350462008</span>
                                <span className="text-sm font-medium">Patrick Corda</span>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-stone-100 flex flex-col items-center gap-4">
                                <p className="text-xs font-bold text-stone-600 tracking-wide uppercase">Scan to Pay via GCash</p>
                                {shop?.document_qr_code ? (
                                    <img
                                        src={`/storage/${shop.document_qr_code}`}
                                        alt="Shop QR Code"
                                        className="w-full max-w-[280px] h-auto object-contain border-4 border-white rounded-lg shadow-sm"
                                    />
                                ) : (
                                    <div className="flex h-64 w-full max-w-[280px] items-center justify-center rounded-lg bg-stone-50 text-sm font-semibold text-rose-700 text-center px-4 border-4 border-white shadow-sm">
                                        QR code is not yet configured by the shop.
                                    </div>
                                )}

                                <a
                                    href={shop?.document_qr_code ? `/storage/${shop.document_qr_code}` : '#'}
                                    download="Patrick-Corda-GCash-QR.png"
                                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${shop?.document_qr_code ? 'text-emerald-700 hover:text-emerald-900' : 'pointer-events-none text-stone-400'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Download QR Code
                                </a>
                            </div>

                            <div className="flex flex-col gap-5 border-t border-stone-100 pt-8">
                                <div>
                                    <label htmlFor="reference_id" className="block text-sm font-bold text-stone-700 mb-1">
                                        Reference ID
                                    </label>
                                    <input
                                        id="reference_id"
                                        type="text"
                                        value={referenceId}
                                        onChange={(e) => setReferenceId(e.target.value)}
                                        placeholder="Enter transfer reference number"
                                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="payment_proof" className="block text-sm font-bold text-stone-700 mb-1">
                                        Screenshot Proof
                                    </label>
                                    <input
                                        id="payment_proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePaymentProofChange(e.target.files?.[0] || null)}
                                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm"
                                    />
                                    {paymentProofError && <p className="mt-2 text-xs font-semibold text-rose-600">{paymentProofError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {paymentError && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-rose-900">Payment Error</p>
                            <p className="text-sm text-rose-700">{paymentError}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleRequestPayment}
                        disabled={!selectedPaymentType || isPaymentProcessing || (paymentMethod === 'manual' && (!paymentProof || Boolean(paymentProofError)))}
                        className="px-5 py-2.5 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPaymentProcessing ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                {paymentMethod === 'manual' ? 'Submit Payment Proof' : 'Confirm Payment'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <AlertModal
                isOpen={alert.isOpen}
                onClose={() => setAlert((prev) => ({ ...prev, isOpen: false }))}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </div>
    );
};

export default PaymentModal;
