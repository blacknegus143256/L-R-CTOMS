import Modal from '@/Components/Modal';
import MapLibrePicker from '@/Components/MapLibrePicker';
import { MapPin, RefreshCw, ChevronLeft } from 'lucide-react';
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
                barangay: draftData?.barangay,
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
                            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
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

                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            className="px-4 py-2.5 text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConfirm();
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            Confirm Location
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={showMismatchModal} onClose={() => setShowMismatchModal(false)} maxWidth="sm">
                <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 pt-0.5">
                            <MapPin className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-rose-600 mb-1">Location Mismatch Detected</h3>
                            <p className="text-sm text-stone-600">
                                The map detects this pin is in <strong className="font-bold text-stone-900">{draftData?.apiBarangay}</strong>, but your profile is set to <strong className="font-bold text-stone-900">{currentBarangay}</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-amber-900 font-medium">
                            Which barangay would you like to use?
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMismatchModal(false);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Review Map
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const detectedBarangay = draftData?.apiBarangay;
                                const detectedStreet = draftData?.street || '';
                                const lat = draftData?.latitude;
                                const lng = draftData?.longitude;

                                // Update local draft for immediate UI feedback
                                handleSetDraftData('barangay', detectedBarangay);

                                // Immediately pass the explicit values to the save handler to avoid async state delays
                                onSave?.({
                                    lat,
                                    lng,
                                    street: detectedStreet,
                                    barangay: detectedBarangay,
                                });

                                setShowMismatchModal(false);
                                onClose?.();
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Update to {draftData?.apiBarangay} & Save
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                executeSave();
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                        >
                            Save Current ({currentBarangay})
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}