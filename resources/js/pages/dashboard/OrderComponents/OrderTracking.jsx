import React from 'react';
import { ArrowLeft, Package, CheckCircle, Clock, Scissors, MapPin} from 'lucide-react';
import { TbCurrencyPeso } from 'react-icons/tb';

const OrderTracking = ({
    currentOrder,
    customerMeasurements,
    setCustomerMeasurements,
    isAcceptingQuote,
    setIsAcceptingQuote,
    shop,
    onAcceptQuote
}) => {
    const extractCancellationMeta = (notes) => {
        const text = (notes || '').toString();
        const customerMatch = text.match(/DECLINED BY CUSTOMER:\s*([\s\S]*?)(?:\n\n|$)/i);
        if (customerMatch) {
            return {
                status: 'declined',
                actor: 'Customer',
                reason: customerMatch[1].trim() || 'No reason provided.'
            };
        }

        const shopMatch = text.match(/REJECTED BY SHOP:\s*([\s\S]*?)(?:\n\n|$)/i);
        if (shopMatch) {
            return {
                status: 'rejected',
                actor: 'Shop',
                reason: shopMatch[1].trim() || 'No reason provided.'
            };
        }

        return null;
    };

    // Normalize status to lowercase to prevent case-sensitivity bugs (e.g. 'CONFIRMED' vs 'Confirmed')
    const rawStatus = (currentOrder.status || 'Requested')
        .toString()
        .trim()
        .toLowerCase();
    const notesText = (currentOrder.notes || '').toString();
    const cancellationMeta = extractCancellationMeta(notesText);
    const normalizedTerminalStatus = cancellationMeta?.status || rawStatus;

    const statusMap = {
        'requested': 'pending',
        'quoted': 'quoted',
        'confirmed': 'confirmed',
        'appointment scheduled': 'confirmed',
        'ready for production': 'confirmed',
        'in progress': 'in_progress',
        'in production': 'in_progress', // Legacy fallback
        'ready': 'ready',
        'ready for pickup': 'ready',
        'completed': 'completed',
        'rejected': 'rejected',
        'declined': 'declined',
        'cancelled': 'cancelled'
    };

    const normalizedStatus = statusMap[rawStatus] || 'pending';
    const terminalStatus = statusMap[normalizedTerminalStatus] || normalizedStatus;
    const terminalLabelMap = {
        rejected: 'Rejected by Shop',
        declined: 'Declined by Customer',
        cancelled: 'Cancelled'
    };
    const terminalLabel = terminalLabelMap[terminalStatus] || 'Cancelled';
    const terminalDescription = cancellationMeta
        ? `${cancellationMeta.actor} cancelled this order. Reason: ${cancellationMeta.reason}`
        : 'This order was cancelled.';

    const statuses = [
        { id: 'pending', label: 'Order Placed', icon: Clock, desc: 'Awaiting tailor review and quote.' },
        { id: 'quoted', label: 'Quote Received', icon: TbCurrencyPeso, desc: 'Tailor has provided a price and timeline.' },
        { id: 'confirmed', label: 'Confirmed & Measured', icon: CheckCircle, desc: 'Quote accepted and measurements locked in.' },
        { id: 'in_progress', label: 'In Progress (Sewing)', icon: Scissors, desc: 'The tailor is actively working on your garment.' },
        { id: 'ready', label: 'Ready for Pickup', icon: MapPin, desc: 'Your custom order is finished and ready to be collected!' },
        { id: 'completed', label: 'Completed', icon: CheckCircle, desc: 'Order finished and handed over to customer.' },
    ];

    if (cancellationMeta || !statuses.some((status) => status.id === terminalStatus)) {
        statuses.push({
            id: cancellationMeta ? `terminal-${terminalStatus}` : terminalStatus,
            label: terminalLabel,
            icon: Clock,
            desc: terminalDescription
        });
    }

    const currentStatusIndex = statuses.findIndex(s => s.id === terminalStatus) >= 0 
        ? statuses.findIndex(s => s.id === terminalStatus) 
        : 0;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-black text-slate-800 mb-8">Order Progress</h2>
            <div className="relative pl-4 md:pl-8">
                {/* Vertical timeline line */}
                <div className="absolute left-[27px] md:left-[43px] top-4 bottom-8 w-0.5 bg-stone-200"></div>
                
                {statuses.map((status, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isFuture = index > currentStatusIndex;
                    const Icon = status.icon;

                    return (
                        <div key={status.id} className={`relative flex items-start mb-10 last:mb-0 ${isFuture ? 'opacity-50 grayscale' : ''}`}>
                            <div className={`relative z-10 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-4 shadow-sm transition-all duration-500 ${
                                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' :
                                isCurrent ? 'bg-orchid-500 border-orchid-500 text-orchid-600 ring-4 ring-orchid-500/20' :
                                'bg-stone-100 border-stone-200 text-stone-400'
                            }`}>
                                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="ml-6 pt-1 md:pt-2 flex-1">
                                <h3 className={`text-lg font-bold ${isCurrent ? 'text-orchid-700' : 'text-slate-800'}`}>
                                    {status.label}
                                </h3>
                                <p className="text-stone-500 text-sm mt-1">{status.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Call to Action when Quoted */}
            {currentOrder.status === 'Quoted' && (
                <div className="mt-10 bg-orchid-50 border border-orchid-200 rounded-2xl p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-orchid-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-orchid-700">
                        Quote Ready for Review
                    </h3>
                    <p className="text-sm text-stone-600 mt-1">
                        Your tailor has provided a quote. Please review and confirm your order.
                    </p>
                </div>
            )}

            {cancellationMeta && (
                <div className="mt-10 bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-bold text-rose-700">{terminalLabel}</h3>
                    <p className="text-sm text-rose-700/90 mt-1">
                        {terminalDescription}
                    </p>
                </div>
            )}


        </div>
    );
};

export default OrderTracking;

