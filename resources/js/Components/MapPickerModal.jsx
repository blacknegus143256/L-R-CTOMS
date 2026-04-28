import Modal from '@/Components/Modal';
import MapLibrePicker from '@/Components/MapLibrePicker';
import { useEffect, useState } from 'react';

export default function MapPickerModal({
    show,
    data,
    currentStreet,
    currentBarangay,
    initialLat,
    initialLng,
    searchQuery,
    onClose,
    onSave,
}) {
    const [draftData, setDraftData] = useState(data || {});
    const [showMismatchModal, setShowMismatchModal] = useState(false);

    useEffect(() => {
        if (show) {
            setDraftData({
                ...(data || {}),
                street: currentStreet ?? data?.street ?? '',
                barangay: currentBarangay ?? data?.barangay ?? '',
            });
        }
    }, [show, data, currentStreet, currentBarangay]);

    const handleSetDraftData = (field, value) => {
        setDraftData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleConfirm = () => {
        const apiBgy = String(draftData?.apiBarangay || '').toLowerCase().trim();
        const selBgy = String(currentBarangay || '').toLowerCase().trim();

        // If API found a barangay, it doesn't match the dropdown, and isn't just saying "dumaguete"
        if (apiBgy && selBgy && apiBgy !== selBgy && !apiBgy.includes('dumaguete')) {
            setShowMismatchModal(true);
            return;
        }

        executeSave();
    };

    const executeSave = () => {
        if (onSave) {
            onSave({
                lat: draftData?.latitude,
                lng: draftData?.longitude,
                street: draftData?.street || '',
            });
        }
        setShowMismatchModal(false);
        onClose?.();
    };

    return (
        <>
            <Modal show={show} maxWidth="2xl" onClose={onClose}>
                <div className="p-5 md:p-6">
                    <div className="mb-4 flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-stone-900">Pin Location on Map</h3>
                            <p className="mt-1 text-sm text-stone-600">Choose the exact location for your tailoring shop.</p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
                        >
                            Close
                        </button>
                    </div>

                    <MapLibrePicker
                        data={draftData}
                        setData={handleSetDraftData}
                        initialLat={initialLat}
                        initialLng={initialLng}
                        selectedBarangay={draftData?.barangay || ''}
                        searchQuery={searchQuery}
                    />

                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConfirm();
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-700"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={showMismatchModal} onClose={() => setShowMismatchModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="text-lg font-black text-rose-600 mb-2">Location Mismatch Warning</h3>
                    <p className="text-sm text-stone-600 mb-6">
                        The map detects this pin is near <strong>{draftData?.apiBarangay}</strong>, but your profile is set to <strong>{currentBarangay}</strong>.
                        {' '}Are you sure you want to save this location?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowMismatchModal(false)} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl">
                            Review Map
                        </button>
                        <button type="button" onClick={executeSave} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">
                            Save Anyway
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}