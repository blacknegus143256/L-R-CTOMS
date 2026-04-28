import Modal from '@/Components/Modal';

export default function DocumentModal({
    isOpen,
    onClose,
    onAgree,
    title,
    pdfUrl,
}) {
    return (
        <Modal show={isOpen} maxWidth="2xl" onClose={onClose}>
            <div className="p-5 md:p-6">
                <div className="mb-4 flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                    <h3 className="text-lg font-black text-stone-900">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
                        aria-label="Close document"
                    >
                        X
                    </button>
                </div>

                <iframe src={pdfUrl} className="w-full h-[60vh] border-0" title={title}>
                    If your browser doesn't support PDFs,{' '}
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">click here to view it</a>.
                </iframe>
            </div>

            <div className="flex justify-end gap-3 border-t border-stone-200 bg-stone-50 p-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-stone-600 transition-colors hover:bg-stone-200"
                >
                    Close
                </button>
                {onAgree && (
                    <button
                        type="button"
                        onClick={onAgree}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        I Agree to {title}
                    </button>
                )}
            </div>
        </Modal>
    );
}