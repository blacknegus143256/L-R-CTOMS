import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { getImageUploadError } from '@/utils/imageUpload';
import { MapPin, ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_SHIFT_MINUTES = 12 * 60;

const toMinutes = (time) => {
    if (!time) {
        return null;
    }

    const [hours, minutes] = String(time).split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }

    return (hours * 60) + minutes;
};

const addMinutes = (time, minutesToAdd) => {
    const baseMinutes = toMinutes(time);
    if (baseMinutes === null) {
        return '';
    }

    const nextMinutes = baseMinutes + minutesToAdd;
    if (nextMinutes >= 24 * 60) {
        return '';
    }

    const hours = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
    const minutes = String(nextMinutes % 60).padStart(2, '0');

    return `${hours}:${minutes}`;
};

const isOverTwelveHours = (open, close) => {
    if (!open || !close) {
        return false;
    }

    const duration = toMinutes(close) - toMinutes(open);
    return duration > MAX_SHIFT_MINUTES;
};

const validateTime = (open, close) => {
    if (!open || !close) {
        return '';
    }

    if (close <= open) {
        return 'Closing time must be after opening time.';
    }

    if (isOverTwelveHours(open, close)) {
        return 'Shift cannot exceed 12 hours.';
    }

    return '';
};

export default function ShopSettings({ auth, shop }) {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [logoError, setLogoError] = useState('');
    const [qrError, setQrError] = useState('');
    const [isFromOnboarding, setIsFromOnboarding] = useState(false);

    useEffect(() => {
        // Capture the onboarding flag once on mount
        const urlParams = new URLSearchParams(window.location.search);
        setIsFromOnboarding(urlParams.get('from_onboarding') === 'true');
        
        if (window.location.hash === '#weekly-schedule') {
            setIsScheduleOpen(true);
            setTimeout(() => {
                const element = document.getElementById('weekly-schedule');

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    }, []);

   

    const defaultWeek = Array.from({ length: 7 }, (_, dayOfWeek) => ({
        day_of_week: dayOfWeek,
        is_open: false,
        open_time: '',
        close_time: '',
    }));

    const mergedSchedules = defaultWeek.map((defaultDay, item) => {
        const existing = (shop?.schedules || []).find((item) => item.day_of_week === defaultDay.day_of_week);

        return {
            day_of_week: defaultDay.day_of_week,
            is_open: Boolean( existing?.is_open),
            open_time: existing?.open_time ? String(existing.open_time).slice(0, 5) : '',
            close_time: existing?.close_time ? String(existing.close_time).slice(0, 5) : '',
        };
    });

    const initialExceptions = (shop?.exceptions || []).map((item) => ({
        date: item?.date ? String(item.date).slice(0, 10) : '',
        is_closed: Boolean(item?.is_closed),
        open_time: item?.open_time ? String(item.open_time).slice(0, 5) : '',
        close_time: item?.close_time ? String(item.close_time).slice(0, 5) : '',
        reason: item?.reason || '',
    }));

    const initialFormData = {
        logo: null,
        _method: 'patch',
        google_maps_link: shop?.google_maps_link || '',
        payout_method: shop?.payout_method || '',
        payout_account: shop?.payout_account || '',
        slot_duration_minutes: shop?.slot_duration_minutes ?? 30,
        document_qr_code: null,
        max_bookings_per_slot: shop?.max_bookings_per_slot ?? 1,
        max_user_bookings_per_slot: shop?.max_user_bookings_per_slot ?? 3,
        schedules: mergedSchedules,
        exceptions: initialExceptions,
    };

    const normalizeFormState = (source) => ({
        _method: source?._method || 'patch',
        google_maps_link: source?.google_maps_link || '',
        payout_method: source?.payout_method || '',
        payout_account: source?.payout_account || '',
        slot_duration_minutes: Number(source?.slot_duration_minutes ?? 30),
        max_bookings_per_slot: Number(source?.max_bookings_per_slot ?? 1),
        max_user_bookings_per_slot: Number(source?.max_user_bookings_per_slot ?? 3),
        schedules: (source?.schedules || []).map((item) => ({
            day_of_week: Number(item?.day_of_week ?? 0),
            is_open: Boolean(item?.is_open),
            open_time: item?.open_time || '',
            close_time: item?.close_time || '',
        })),
        exceptions: (source?.exceptions || []).map((item) => ({
            date: item?.date || '',
            is_closed: Boolean(item?.is_closed),
            open_time: item?.open_time || '',
            close_time: item?.close_time || '',
            reason: item?.reason || '',
        })),
        logo: source?.logo?.name || null,
        document_qr_code: source?.document_qr_code?.name || null,
    });

    const { data, setData, post, processing, errors, defaults } = useForm(initialFormData);
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(normalizeFormState(initialFormData)));
    const hasUnsavedChanges = JSON.stringify(normalizeFormState(data)) !== savedSnapshot;

    const clearDirtyState = () => {
        // Reset the saved snapshot to match current data
        setSavedSnapshot(JSON.stringify(normalizeFormState(data)));
    };


    const updateSchedule = (index, key, value) => {
        const next = [...data.schedules];
        let newOpen = key === 'open_time' ? value : next[index].open_time;
        let newClose = key === 'close_time' ? value : next[index].close_time;

        if (key === 'is_open' && value === true) {
            if (!newOpen) {
                newOpen = '08:00';
            }
            if (!newClose) {
                newClose = '17:00';
            }
        }

        if (key === 'is_open' && !value) {
            newOpen = '';
            newClose = '';
        }

        if (key === 'open_time' && newClose && value >= newClose) {
            const suggestedClose = addMinutes(value, 60);
            newClose = suggestedClose && suggestedClose > value ? suggestedClose : '';
        }

        next[index] = {
            ...next[index],
            [key]: value,
            open_time: newOpen,
            close_time: newClose,
        };

        setData('schedules', next);
    };

    const applyMondayHoursToAllOpenDays = () => {
        const mondaySchedule = data.schedules.find((schedule) => schedule.day_of_week === 1);

        if (!mondaySchedule?.open_time || !mondaySchedule?.close_time) {
            return;
        }

        const next = data.schedules.map((schedule) => {
            if (!schedule.is_open) {
                return schedule;
            }

            return {
                ...schedule,
                open_time: mondaySchedule.open_time,
                close_time: mondaySchedule.close_time,
            };
        });

        setData('schedules', next);
    };

    const updateException = (index, key, value) => {
        const next = [...data.exceptions];
        let newOpen = key === 'open_time' ? value : next[index].open_time;
        let newClose = key === 'close_time' ? value : next[index].close_time;

        if (key === 'is_closed' && value) {
            newOpen = '';
            newClose = '';
        }

        if (key === 'open_time' && newClose && value >= newClose) {
            const suggestedClose = addMinutes(value, 60);
            newClose = suggestedClose && suggestedClose > value ? suggestedClose : '';
        }

        next[index] = {
            ...next[index],
            [key]: value,
            open_time: newOpen,
            close_time: newClose,
        };

        setData('exceptions', next);
    };

    const scheduleTimeErrors = data.schedules.map((schedule) => {
        if (!schedule.is_open) {
            return '';
        }
        return validateTime(schedule.open_time, schedule.close_time);
    });

    const exceptionTimeErrors = data.exceptions.map((item) => {
        if (item.is_closed) {
            return '';
        }
        return validateTime(item.open_time, item.close_time);
    });

    const hasAnyTimeValidationError = [...scheduleTimeErrors, ...exceptionTimeErrors].some(Boolean);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (showSuccessModal) {
                return;
            }

            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, showSuccessModal]);
    
    const addException = () => {
        setData('exceptions', [
            ...data.exceptions,
            {
                date: '',
                is_closed: true,
                open_time: '',
                close_time: '',
                reason: '',
            },
        ]);
    };

    const removeException = (index) => {
        setData('exceptions', data.exceptions.filter((_, idx) => idx !== index));
    };

    const handleLogoChange = (file) => {
        if (!file) {
            setLogoError('');
            setData('logo', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setLogoError(error);
            setData('logo', null);
            return;
        }

        setLogoError('');
        setData('logo', file);
    };

    const handleQrChange = (file) => {
        if (!file) {
            setQrError('');
            setData('document_qr_code', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setQrError(error);
            setData('document_qr_code', null);
            return;
        }

        setQrError('');
        setData('document_qr_code', file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (logoError || qrError) {
            return;
        }
        post(route('store.settings.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setShowSuccessModal(true);
            },
            onError: (errors) => {
                console.error('Shop settings update error:', errors);
            },
        });
    };



    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Shop Settings" />

            <div className="py-10 bg-stone-50 min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8">
                        <h1 className="text-3xl font-black text-stone-900">Shop Settings</h1>
                        <p className="mt-2 text-sm text-stone-500 font-medium">
                            Configure booking capacity, weekly schedule, and date-specific exceptions.
                        </p>

                        {shop.requires_resubmission && (
                            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900">Document Resubmission Required</h3>
                                        <p className="text-sm text-amber-800 mt-1">{shop.resubmission_reason}</p>
                                        <p className="text-xs text-amber-700 mt-2">
                                            Please review the feedback above and resubmit the corrected documents in the documents section when you're ready.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10 mt-8" encType="multipart/form-data">
                            <section>
                                <h2 className="text-xl font-black text-stone-900 mb-4">Shop Details & Location</h2>
                                <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                                            <label htmlFor="google_maps_link" className="block text-sm font-bold text-stone-700">
                                                Google Maps Link (Optional)
                                            </label>
                                        </div>
                                        <input
                                            id="google_maps_link"
                                            type="url"
                                            value={data.google_maps_link || ''}
                                            onChange={(e) => setData('google_maps_link', e.target.value)}
                                            placeholder="https://maps.google.com/maps/place/..."
                                            disabled={processing}
                                            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-stone-100"
                                        />
                                        {errors.google_maps_link && (
                                            <div className="flex items-start gap-2 mt-2">
                                                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-rose-600 text-xs font-medium">{errors.google_maps_link}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                                            Paste the exact share link from Google Maps to ensure customers get perfectly accurate directions. This helps them find your shop without entering an address manually.
                                        </p>
                                        {data.google_maps_link && (
                                            <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                <a
                                                    href={data.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
                                                >
                                                    Preview link
                                                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-stone-900 mb-4">Shop Profile Image</h2>
                                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 shadow-sm space-y-4">
                                    {shop?.logo_url ? (
                                        <img
                                            src={'/storage/' + shop.logo_url}
                                            alt={shop.shop_name || 'Shop logo'}
                                            className="w-32 h-32 object-cover rounded-xl border border-stone-200 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-xl border border-dashed border-stone-300 bg-white flex items-center justify-center text-sm font-semibold text-stone-400">
                                            No image uploaded
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2" htmlFor="logo">
                                            Upload shop logo / storefront image
                                        </label>
                                        <input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleLogoChange(e.target.files[0] || null)}
                                            className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orchid-50 file:text-orchid-700 hover:file:bg-orchid-100"
                                            disabled={processing}
                                        />
                                        {errors.logo && <p className="text-red-600 text-sm mt-1">{errors.logo}</p>}
                                        {logoError && <p className="text-red-600 text-sm mt-1">{logoError}</p>}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-stone-900 mb-4">Payout Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Payout Method</label>
                                        <select
                                            value={data.payout_method}
                                            onChange={(e) => setData('payout_method', e.target.value)}
                                            className="w-full rounded-xl border border-stone-300 px-4 py-2.5"
                                            disabled={processing}
                                        >
                                            <option value="">Select payment method</option>
                                            <option value="GCash">GCash</option>
                                            <option value="Maya">Maya</option>
                                            <option value="BPI">BPI</option>
                                            <option value="BDO">BDO</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.payout_method && <p className="text-red-600 text-sm mt-1">{errors.payout_method}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Payout Account</label>
                                        <input
                                            type="text"
                                            value={data.payout_account}
                                            onChange={(e) => setData('payout_account', e.target.value)}
                                            placeholder="09123456789 - Account Name"
                                            className="w-full rounded-xl border border-stone-300 px-4 py-2.5"
                                            disabled={processing}
                                        />
                                        {errors.payout_account && <p className="text-red-600 text-sm mt-1">{errors.payout_account}</p>}
                                    </div>

                                    <div className="md:col-span-2 space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-stone-700 mb-2" htmlFor="document_qr_code">
                                                    Payment QR Code
                                                </label>
                                                <p className="text-xs text-stone-500 font-medium">
                                                    Upload the QR image customers will use for manual transfer payments.
                                                </p>
                                            </div>

                                            {shop?.document_qr_code ? (
                                                <img
                                                    src={'/storage/' + shop.document_qr_code}
                                                    alt="Payment QR Code"
                                                    className="w-24 h-24 rounded-xl object-cover border border-stone-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs font-semibold text-stone-400 text-center px-2">
                                                    No QR uploaded
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            id="document_qr_code"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleQrChange(e.target.files[0] || null)}
                                            className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            disabled={processing}
                                        />
                                        {errors.document_qr_code && <p className="text-red-600 text-sm mt-1">{errors.document_qr_code}</p>}
                                        {qrError && <p className="text-red-600 text-sm mt-1">{qrError}</p>}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-stone-900 mb-4">Capacity Rules</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Slot Duration (minutes)</label>
                                        <input
                                            type="number"
                                            min="15"
                                            value={data.slot_duration_minutes}
                                            onChange={(e) => setData('slot_duration_minutes', Number(e.target.value))}
                                            className="w-full rounded-xl border border-stone-300 px-4 py-2.5"
                                            disabled={processing}
                                        />
                                        {errors.slot_duration_minutes && <p className="text-red-600 text-sm mt-1">{errors.slot_duration_minutes}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Max Bookings Per Slot</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.max_bookings_per_slot}
                                            onChange={(e) => setData('max_bookings_per_slot', Number(e.target.value))}
                                            className="w-full rounded-xl border border-stone-300 px-4 py-2.5"
                                            disabled={processing}
                                        />
                                        {errors.max_bookings_per_slot && <p className="text-red-600 text-sm mt-1">{errors.max_bookings_per_slot}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Max User Bookings Per Slot</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.max_user_bookings_per_slot}
                                            onChange={(e) => setData('max_user_bookings_per_slot', Number(e.target.value))}
                                            className="w-full rounded-xl border border-stone-300 px-4 py-2.5"
                                            disabled={processing}
                                        />
                                        {errors.max_user_bookings_per_slot && <p className="text-red-600 text-sm mt-1">{errors.max_user_bookings_per_slot}</p>}
                                    </div>
                                </div>
                            </section>

                            <section id="weekly-schedule">
                                <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                                        className="flex w-full items-center justify-between bg-stone-50 p-6 transition-colors hover:bg-stone-100"
                                    >
                                        <div className="text-left">
                                            <h2 className="text-lg font-black text-slate-800">Weekly Schedule</h2>
                                            <p className="mt-1 text-sm text-stone-500">Set your shop's opening and closing hours for each day.</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                                            {isScheduleOpen ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4" />
                                                    Hide
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4" />
                                                    Show
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    {isScheduleOpen && (
                                        <div className="space-y-3 border-t border-stone-200 p-6">
                                            {data.schedules.map((schedule, index) => (
                                                <div key={schedule.day_of_week} className="grid grid-cols-1 gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md md:grid-cols-5">
                                                    <div className="md:col-span-2 flex items-center justify-between gap-4">
                                                        <div>
                                                            <span className="block text-sm font-black uppercase tracking-[0.2em] text-stone-500">Day</span>
                                                            <span className="mt-1 block text-lg font-black text-stone-800">{dayNames[schedule.day_of_week]}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={schedule.is_open}
                                                                    onChange={(e) => updateSchedule(index, 'is_open', e.target.checked)}
                                                                    disabled={processing}
                                                                />
                                                                Open
                                                            </label>
                                                            {schedule.day_of_week === 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={applyMondayHoursToAllOpenDays}
                                                                    disabled={processing || !schedule.open_time || !schedule.close_time}
                                                                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Apply Monday's Hours to All Open Days
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500">Opening Time</label>
                                                        <input
                                                            type="time"
                                                            value={schedule.open_time}
                                                            onChange={(e) => updateSchedule(index, 'open_time', e.target.value)}
                                                            disabled={!schedule.is_open || processing}
                                                            className="w-full rounded-2xl border border-stone-300 px-3 py-3 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500">Closing Time</label>
                                                        <input
                                                            type="time"
                                                            value={schedule.close_time}
                                                            onChange={(e) => updateSchedule(index, 'close_time', e.target.value)}
                                                            disabled={!schedule.is_open || processing}
                                                            className="w-full rounded-2xl border border-stone-300 px-3 py-3 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100"
                                                        />
                                                        {scheduleTimeErrors[index] && (
                                                            <p className="text-xs font-semibold text-rose-600">{scheduleTimeErrors[index]}</p>
                                                        )}
                                                        <p
                                                            className={`text-xs leading-5 ${isOverTwelveHours(schedule.open_time, schedule.close_time) ? 'text-rose-500 font-semibold' : 'text-stone-500'}`}
                                                        >
                                                            {isOverTwelveHours(schedule.open_time, schedule.close_time)
                                                                ? 'This shift exceeds 12 hours. Please shorten the duration.'
                                                                : 'Click the clock icon inside the box to select a time easily.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-black text-stone-900">Exceptions and Holidays</h2>
                                    <button
                                        type="button"
                                        onClick={addException}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
                                        disabled={processing}
                                    >
                                        Add Exception
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {data.exceptions.length === 0 && (
                                        <p className="text-sm text-stone-500 font-medium">No exceptions added yet.</p>
                                    )}

                                    {data.exceptions.map((item, index) => (
                                        <div key={`${item.date || 'new'}-${index}`} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={item.date}
                                                        onChange={(e) => updateException(index, 'date', e.target.value)}
                                                        className="w-full rounded-xl border border-stone-300 px-3 py-2"
                                                        disabled={processing}
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex items-center justify-between">
                                                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.is_closed}
                                                            onChange={(e) => updateException(index, 'is_closed', e.target.checked)}
                                                            disabled={processing}
                                                        />
                                                        Closed Entire Day
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeException(index)}
                                                        className="text-sm font-bold text-rose-600 hover:text-rose-800"
                                                        disabled={processing}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            {!item.is_closed && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Opening Time</label>
                                                        <input
                                                            type="time"
                                                            value={item.open_time}
                                                            onChange={(e) => updateException(index, 'open_time', e.target.value)}
                                                            className="w-full rounded-2xl border border-stone-300 px-3 py-3 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100"
                                                            disabled={processing}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Closing Time</label>
                                                        <input
                                                            type="time"
                                                            value={item.close_time}
                                                            onChange={(e) => updateException(index, 'close_time', e.target.value)}
                                                            className="w-full rounded-2xl border border-stone-300 px-3 py-3 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100"
                                                            disabled={processing}
                                                        />
                                                        {exceptionTimeErrors[index] && (
                                                            <p className="mt-2 text-xs font-semibold text-rose-600">{exceptionTimeErrors[index]}</p>
                                                        )}
                                                        <p
                                                            className={`mt-2 text-xs leading-5 ${isOverTwelveHours(item.open_time, item.close_time) ? 'text-rose-500 font-semibold' : 'text-stone-500'}`}
                                                        >
                                                            {isOverTwelveHours(item.open_time, item.close_time)
                                                                ? 'This exception shift exceeds 12 hours. Please shorten the duration.'
                                                                : 'Use these hours only when this date differs from your weekly schedule.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-bold text-stone-600 mb-1">Reason (optional)</label>
                                                <input
                                                    type="text"
                                                    value={item.reason}
                                                    onChange={(e) => updateException(index, 'reason', e.target.value)}
                                                    className="w-full rounded-xl border border-stone-300 px-3 py-2"
                                                    placeholder="Holiday, inventory day, private event, etc."
                                                    disabled={processing}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="pt-6 flex flex-col sm:flex-row justify-between gap-4 border-t border-stone-200">
                                <div className="text-sm text-stone-600 flex items-center gap-2 py-1">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="font-medium">All changes will be saved together</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing || Boolean(logoError) || Boolean(qrError) || hasAnyTimeValidationError}
                                    className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {processing ? 'Saving...' : 'Save All Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-center p-8 relative">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>

                        {isFromOnboarding ? (
                            <>
                                <h2 className="text-2xl font-black text-slate-800 mb-3">Congratulations!</h2>
                                <div className="mb-6 space-y-3 text-left">
                                    <p className="text-stone-600 text-sm">
                                        You have successfully completed the onboarding process. Your shop schedule and settings are now saved.
                                    </p>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-amber-900 text-sm font-semibold">
                                            Your shop is now pending admin approval. Once approved, you'll be able to accept orders from customers.
                                        </p>
                                    </div>
                                    <p className="text-stone-600 text-sm">
                                        While you wait for approval, you can explore the app and add more services or inventory items to prepare for your future customers.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Settings Saved!</h2>
                                <p className="text-stone-600 text-sm mb-6">
                                    {!shop?.is_active
                                        ? 'Your settings are saved. Your shop is pending admin approval.'
                                        : 'Your shop settings have been successfully updated and are live.'
                                    }
                                </p>
                            </>
                        )}

                        <div className="flex flex-col gap-3 mt-6">
                            {isFromOnboarding && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        router.get(route('store.dashboard'));
                                    }}
                                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md"
                                >
                                    Explore Dashboard
                                </button>
                            )}
                            {isFromOnboarding && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        router.get(route('store.onboarding', { startStep: 5 }));
                                    }}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
                                >
                                    Return to Onboarding
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                }}
                                className="w-full py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                            >
                                Stay on this Page
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
