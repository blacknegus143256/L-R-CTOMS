export const getTailorActionFlags = (order) => {
    const rawStatus = String(order?.status || 'Pending').trim().toLowerCase();
    const paymentStatus = String(order?.payment_status || 'Pending').trim();
    const paymentStatusLower = paymentStatus.toLowerCase();

    return {
        rawStatus,
        paymentStatus,
        canRecordCashPayment: rawStatus === 'quoted' || (rawStatus === 'confirmed' && paymentStatusLower === 'pending'),
        canStartProduction: ['confirmed', 'ready for production'].includes(rawStatus),
        canMarkReadyForPickup: rawStatus === 'in progress',
        canMarkCompleted: rawStatus === 'ready for pickup',
        canCollectRemainingCash: paymentStatusLower === 'partial' && ['ready for pickup', 'completed'].includes(rawStatus),
    };
};

export const getNormalizedStatusLabel = (status) => {
    const rawStatus = String(status || 'Pending').trim().toLowerCase();

    if (!rawStatus) {
        return 'Pending';
    }

    if (rawStatus === 'ready') {
        return 'Ready for Pickup';
    }

    return rawStatus
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

export const getPaymentStatusClass = (paymentStatus) => {
    const normalized = String(paymentStatus || 'Pending').trim().toLowerCase();

    if (normalized === 'partial') {
        return 'bg-amber-100 text-amber-800 border border-amber-300';
    }

    if (normalized === 'paid') {
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }

    return 'bg-stone-100 text-stone-700 border border-stone-200';
};

export const getPaymentDisplayData = (order) => {
    const paymentStatus = String(order?.payment_status || 'Pending').trim();
    const normalizedPaymentStatus = paymentStatus.toLowerCase();
    const amountPaid = Number(order?.amount_paid || 0);
    const totalPrice = Number(order?.total_price || 0);
    const remainingBalance = Math.max(totalPrice - amountPaid, 0);

    return {
        paymentStatus,
        normalizedPaymentStatus,
        amountPaid,
        totalPrice,
        remainingBalance,
        isVerified: normalizedPaymentStatus === 'partial' || normalizedPaymentStatus === 'paid',
        isPartial: normalizedPaymentStatus === 'partial',
        isPaid: normalizedPaymentStatus === 'paid',
    };
};
