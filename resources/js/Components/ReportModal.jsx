import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, reportedId, shopId, initialDetails = '', orderId = null }) {
    const [reason, setReason] = useState('Fraud');
    const [details, setDetails] = useState(initialDetails);
    const [submitting, setSubmitting] = useState(false);
    const [thankYou, setThankYou] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) {
            setReason('Fraud');
            setDetails(initialDetails);
            setSubmitting(false);
            setThankYou(false);
            setErrors({});
        } else {
            setDetails(initialDetails);
        }
    }, [isOpen, initialDetails]);

    if (!isOpen) return null;

    function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setErrors({});

        router.post('/reports', {
            reported_id: reportedId,
            shop_id: shopId,
            reason,
            details,
            order_id: orderId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setThankYou(true);
                setTimeout(() => {
                    setThankYou(false);
                    setSubmitting(false);
                    onClose?.();
                }, 1200);
            },
            onError: (validationErrors) => {
                setErrors(validationErrors || {});
                setSubmitting(false);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold">Report Shop</h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
                </div>

                {!thankYou ? (
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`w-full mb-2 p-3 border rounded-md ${errors.reason ? 'border-rose-400 ring-1 ring-rose-200' : 'border-stone-300'}`}
                        >
                            <option>Fraud</option>
                            <option>Poor Quality</option>
                            <option>Communication Issues</option>
                            <option>Other</option>
                        </select>
                        {errors.reason && <p className="mb-4 text-xs font-medium text-rose-600">{errors.reason}</p>}

                        <label className="block text-sm font-semibold text-stone-700 mb-2">Additional Details (optional)</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className={`w-full p-3 border rounded-md min-h-[120px] mb-2 ${errors.details ? 'border-rose-400 ring-1 ring-rose-200' : 'border-stone-300'}`}
                        />
                        {errors.details && <p className="mb-4 text-xs font-medium text-rose-600">{errors.details}</p>}

                        <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-stone-900 text-white font-bold">
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <h4 className="text-lg font-bold text-emerald-600">Thank you.</h4>
                        <p className="mt-2 text-sm text-stone-600">Our team will review this report.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
