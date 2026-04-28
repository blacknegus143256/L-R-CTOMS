import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function ImpersonateButton({ targetUserId, targetUserRole }) {
    const { auth } = usePage().props;
    const [isProcessing, setIsProcessing] = useState(false);

    if (!targetUserId || targetUserRole === 'super_admin') {
        return null;
    }

    if (auth?.user?.id === targetUserId) {
        return null;
    }

    const handleImpersonate = () => {
        setIsProcessing(true);

        router.post(route('super.impersonate', targetUserId), {}, {
            preserveScroll: true,
            onFinish: () => setIsProcessing(false),
        });
    };

    return (
        <button
            type="button"
            onClick={handleImpersonate}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-2 rounded disabled:opacity-60"
        >
            {isProcessing ? 'Impersonating...' : 'Impersonate'}
        </button>
    );
}