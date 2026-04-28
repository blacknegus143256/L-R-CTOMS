import { useEffect, useMemo, useState } from 'react';
import { APP_CONFIRM_EVENT, APP_PROMPT_EVENT } from '@/utils/dialog';

const TYPE_TITLE_CLASS = {
    error: 'text-rose-600',
    success: 'text-emerald-600',
    info: 'text-sky-600',
};

export default function GlobalDialogHost() {
    const [queue, setQueue] = useState([]);
    const [promptValue, setPromptValue] = useState('');

    const activeDialog = queue[0] || null;

    useEffect(() => {
        const onConfirm = (event) => {
            const detail = event?.detail || {};
            if (typeof detail.resolve !== 'function') {
                return;
            }

            setQueue((prev) => [
                ...prev,
                {
                    mode: 'confirm',
                    title: detail.title || 'Please Confirm',
                    message: detail.message || 'Are you sure you want to continue?',
                    confirmText: detail.confirmText || 'Confirm',
                    cancelText: detail.cancelText || 'Cancel',
                    type: detail.type || 'info',
                    resolve: detail.resolve,
                },
            ]);
        };

        const onPrompt = (event) => {
            const detail = event?.detail || {};
            if (typeof detail.resolve !== 'function') {
                return;
            }

            setQueue((prev) => [
                ...prev,
                {
                    mode: 'prompt',
                    title: detail.title || 'Input Required',
                    message: detail.message || 'Please enter a value.',
                    defaultValue: detail.defaultValue || '',
                    placeholder: detail.placeholder || '',
                    confirmText: detail.confirmText || 'Save',
                    cancelText: detail.cancelText || 'Cancel',
                    type: detail.type || 'info',
                    required: !!detail.required,
                    resolve: detail.resolve,
                },
            ]);
        };

        window.addEventListener(APP_CONFIRM_EVENT, onConfirm);
        window.addEventListener(APP_PROMPT_EVENT, onPrompt);

        return () => {
            window.removeEventListener(APP_CONFIRM_EVENT, onConfirm);
            window.removeEventListener(APP_PROMPT_EVENT, onPrompt);
        };
    }, []);

    useEffect(() => {
        if (activeDialog?.mode === 'prompt') {
            setPromptValue(activeDialog.defaultValue || '');
        }
    }, [activeDialog]);

    const closeActive = () => {
        setQueue((prev) => prev.slice(1));
    };

    const handleCancel = () => {
        if (!activeDialog) {
            return;
        }

        if (activeDialog.mode === 'confirm') {
            activeDialog.resolve(false);
        } else {
            activeDialog.resolve(null);
        }

        closeActive();
    };

    const handleConfirm = () => {
        if (!activeDialog) {
            return;
        }

        if (activeDialog.mode === 'confirm') {
            activeDialog.resolve(true);
        } else {
            const value = String(promptValue ?? '').trim();
            if (activeDialog.required && !value) {
                return;
            }
            activeDialog.resolve(value || null);
        }

        closeActive();
    };

    const titleClass = useMemo(() => {
        if (!activeDialog) {
            return TYPE_TITLE_CLASS.info;
        }

        return TYPE_TITLE_CLASS[activeDialog.type] || TYPE_TITLE_CLASS.info;
    }, [activeDialog]);

    if (!activeDialog) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
                <h2 className={`text-xl font-bold ${titleClass}`}>{activeDialog.title}</h2>
                <p className="mt-3 text-sm text-stone-700">{activeDialog.message}</p>

                {activeDialog.mode === 'prompt' && (
                    <input
                        type="text"
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        placeholder={activeDialog.placeholder}
                        className="mt-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-lg bg-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-300"
                    >
                        {activeDialog.cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                        {activeDialog.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
