import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { showAlert } from '@/utils/alert';
import Modal from '@/Components/Modal';
import { useEffect, useState } from 'react';
import { getImageUploadError } from '@/utils/imageUpload';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ShopSettings({ auth, shop }) {
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [logoError, setLogoError] = useState('');
    const [qrError, setQrError] = useState('');
    const urlParams = new URLSearchParams(window.location.search);
    const isFromOnboarding = urlParams.get('from_onboarding') === 'true';

    useEffect(() => {
        if (window.location.hash === '#weekly-schedule') {
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

    const mergedSchedules = defaultWeek.map((defaultDay) => {
        const existing = (shop?.schedules || []).find((item) => item.day_of_week === defaultDay.day_of_week);

        return {
            day_of_week: defaultDay.day_of_week,
            is_open: Boolean(existing?.is_open),
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

    const { data, setData, post, processing, errors } = useForm({
        logo: null,
        _method: 'patch',
        payout_method: shop?.payout_method || '',
        payout_account: shop?.payout_account || '',
        slot_duration_minutes: shop?.slot_duration_minutes ?? 30,
        document_qr_code: null,
        max_bookings_per_slot: shop?.max_bookings_per_slot ?? 1,
        max_user_bookings_per_slot: shop?.max_user_bookings_per_slot ?? 3,
        schedules: mergedSchedules,
        exceptions: initialExceptions,
    });

    const updateSchedule = (index, key, value) => {
        const next = [...data.schedules];
        next[index] = {
            ...next[index],
            [key]: value,
        };

        if (key === 'is_open' && !value) {
            next[index].open_time = '';
            next[index].close_time = '';
        }

        setData('schedules', next);
    };

    const updateException = (index, key, value) => {
        const next = [...data.exceptions];
        next[index] = {
            ...next[index],
            [key]: value,
        };

        if (key === 'is_closed' && value) {
            next[index].open_time = '';
            next[index].close_time = '';
        }

        setData('exceptions', next);
    };

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
            onSuccess: () => {
                if (isFromOnboarding) {
                    setShowReturnModal(true);
                } else {
                    showAlert({
                        title: 'Success',
                        message: 'Settings Saved Successfully!',
                        type: 'success',
                    });
                }
                setData('logo', null);
                setData('document_qr_code', null);
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

                        <form onSubmit={handleSubmit} className="space-y-10 mt-8" encType="multipart/form-data">
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
                                <h2 className="text-xl font-black text-stone-900 mb-4">Weekly Schedule</h2>
                                <div className="space-y-3">
                                    {data.schedules.map((schedule, index) => (
                                        <div key={schedule.day_of_week} className="grid grid-cols-1 gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md md:grid-cols-5">
                                            <div className="md:col-span-2 flex items-center justify-between gap-4">
                                                <div>
                                                    <span className="block text-sm font-black uppercase tracking-[0.2em] text-stone-500">Day</span>
                                                    <span className="mt-1 block text-lg font-black text-stone-800">{dayNames[schedule.day_of_week]}</span>
                                                </div>
                                                <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={schedule.is_open}
                                                        onChange={(e) => updateSchedule(index, 'is_open', e.target.checked)}
                                                        disabled={processing}
                                                    />
                                                    Open
                                                </label>
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
                                                <p className="text-xs leading-5 text-stone-500">
                                                    Click the clock icon inside the box to select a time easily.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
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

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing || Boolean(logoError) || Boolean(qrError)}
                                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {processing ? 'Saving Settings...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Modal show={showReturnModal} onClose={() => setShowReturnModal(false)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="mb-2 text-lg font-black text-stone-900">Successfully Saved!</h3>
                    <p className="mb-6 text-sm text-stone-600">
                        Your setup is saved. Would you like to return to the Onboarding Wizard to complete your remaining steps?
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href={route('store.onboarding')} className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800">
                            Yes, Return to Wizard
                        </Link>
                        <button type="button" onClick={() => setShowReturnModal(false)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50">
                            No, Stay on this Page
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
