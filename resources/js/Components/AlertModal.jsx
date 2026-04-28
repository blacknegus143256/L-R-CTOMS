import React from 'react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) {
        return null;
    }

    const titleColor = {
        error: 'text-rose-600',
        success: 'text-emerald-600',
        info: 'text-sky-600',
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className={`text-xl font-bold ${titleColor[type] || titleColor.info}`}>{title || 'Notice'}</h2>
                <p className="mt-3 text-sm text-stone-700">{message}</p>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.();
                    }}
                    className="mt-6 w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default AlertModal;

