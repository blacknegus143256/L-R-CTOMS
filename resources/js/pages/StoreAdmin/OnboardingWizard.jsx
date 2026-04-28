import MapPickerModal from '@/Components/MapPickerModal';
import DocumentModal from '@/Components/DocumentModal';
import BarangaySelect from '@/Components/BarangaySelect';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { getImageUploadError } from '@/utils/imageUpload';
import { FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';

const STEP_TITLES = [
    'Basic Profile',
    'Legal Documents',
    'Services',
    'Inventory',
    'Schedule',
    'Review',
];

function StepPill({ number, title, active, done, locked }) {
    return (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${active ? 'border-emerald-300 bg-emerald-50' : done ? 'border-stone-200 bg-stone-50' : locked ? 'border-stone-200 bg-stone-50 opacity-60' : 'border-stone-200 bg-white'}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${active ? 'bg-emerald-600 text-white' : done ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'}`}>
                {number}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-black ${active ? 'text-emerald-900' : 'text-stone-900'}`}>{title}</p>
                <p className="text-xs font-medium text-stone-500">{active ? 'Current step' : done ? 'Completed' : locked ? 'Locked' : 'Ready'}</p>
            </div>
        </div>
    );
}

export default function OnboardingWizard({ auth, shop }) {
    const { props } = usePage();
    const flashSuccess = props?.flash?.success;
    const [currentStep, setCurrentStep] = useState(1);
    const [mapOpen, setMapOpen] = useState(false);
    const [activeDoc, setActiveDoc] = useState(null);
    const [basicProfileLogoError, setBasicProfileLogoError] = useState('');
    const [documentQrError, setDocumentQrError] = useState('');

    const shopProfile = useMemo(() => ({
        contact_person: auth?.user?.name || '',
        contact_number: auth?.user?.profile?.phone || '',
        street: auth?.user?.profile?.street || '',
        location_details: auth?.user?.profile?.location_details || '',
        google_maps_link: shop?.google_maps_link || '',
        latitude: auth?.user?.profile?.latitude || '',
        longitude: auth?.user?.profile?.longitude || '',
        barangay: auth?.user?.profile?.barangay || '',
        purok: '',
        landmark: '',
    }), [auth?.user, shop]);

    const basicProfileForm = useForm({
        ...shopProfile,
        logo: null,
        _method: 'patch',
    });
    const documentForm = useForm({
        document_gov_id: null,
        document_bir: null,
        document_dti: null,
        payout_method: shop?.payout_method || '',
        payout_account: shop?.payout_account || '',
        document_qr_code: null,
        terms_accepted: false,
        dpa_accepted: false,
        nda_accepted: false,
    });

    const handleMapData = (field, value) => {
        basicProfileForm.setData(field, value);

        if (field === 'street') {
            basicProfileForm.setData('street', value);
        }
    };

    const handleBarangayChange = (val) => {
        basicProfileForm.setData('barangay', val);
    };

    const handleMapSave = ({ lat, lng, street }) => {
        basicProfileForm.setData((data) => ({
            ...data,
            latitude: lat ?? data.latitude,
            longitude: lng ?? data.longitude,
            // If the map returns a street, use it. Otherwise, keep what we had.
            street: street || data.street,
        }));
    };

    const handleBasicLogoChange = (file) => {
        if (!file) {
            setBasicProfileLogoError('');
            basicProfileForm.setData('logo', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setBasicProfileLogoError(error);
            basicProfileForm.setData('logo', null);
            return;
        }

        setBasicProfileLogoError('');
        basicProfileForm.setData('logo', file);
    };

    const handleDocumentQrChange = (file) => {
        if (!file) {
            setDocumentQrError('');
            documentForm.setData('document_qr_code', null);
            return;
        }

        const error = getImageUploadError(file);
        if (error) {
            setDocumentQrError(error);
            documentForm.setData('document_qr_code', null);
            return;
        }

        setDocumentQrError('');
        documentForm.setData('document_qr_code', file);
    };

    const submitBasicProfile = (e) => {
        e.preventDefault();

        basicProfileForm.post(route('store.onboarding.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setCurrentStep(2);
                basicProfileForm.setData('logo', null);
                setBasicProfileLogoError('');
            },
        });
    };

    const submitDocuments = (e) => {
        e.preventDefault();

        documentForm.post(route('store.onboarding.submit'), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setCurrentStep(3);
                setDocumentQrError('');
            },
        });
    };

    const hasSubmittedDocuments = !!(shop?.document_gov_id || shop?.document_bir || shop?.document_dti);
    const isApproved = shop?.status === 'approved';
    const isRejected = shop?.status === 'rejected';
    const isUnderReview = hasSubmittedDocuments && shop?.status === 'pending';

    // Dynamic step completion logic based on actual database relationships
    const step1Completed = !!auth?.user?.profile?.barangay;
    const step2Completed = !!shop?.document_bir;
    const step3Completed = (shop?.services && shop.services.length > 0) || shop?.services_count > 0;
    const step4Completed = (shop?.inventory && shop.inventory.length > 0) || shop?.inventory_count > 0;
    const step5Completed = (shop?.schedules && shop.schedules.length > 0) || shop?.schedules_count > 0;
    const step6Completed = false; // Review step is never truly "completed"

    const stepCompletionMap = [step1Completed, step2Completed, step3Completed, step4Completed, step5Completed, step6Completed];

    useEffect(() => {
        const firstIncompleteStep = stepCompletionMap.findIndex((isDone) => !isDone) + 1;

        if (firstIncompleteStep > 1 && firstIncompleteStep <= 6) {
            setCurrentStep(firstIncompleteStep);
        }
    }, []);

    // Step locking logic: only lock if Step 1 AND Step 2 are not both completed
    const bothPriorStepsComplete = step1Completed && step2Completed;
    const isStepLocked = (stepIndex) => {
        // Step 1 and 2 are never locked
        if (stepIndex < 2) return false;
        // Steps 3-6 are locked only if steps 1 and 2 are not complete
        return !bothPriorStepsComplete;
    };

    const stepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">Step 1</p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">Complete your basic profile</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                            Tell customers who runs the shop and where they can find you. We will use the pinned map location and Philippine address details to power the rest of your setup.
                        </p>
                    </div>

                    <form onSubmit={submitBasicProfile} encType="multipart/form-data" className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="contact_person" value="Contact Person" />
                                <TextInput
                                    id="contact_person"
                                    className="mt-1 block w-full rounded-2xl border-stone-300 bg-stone-50 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    value={basicProfileForm.data.contact_person}
                                    onChange={(e) => basicProfileForm.setData('contact_person', e.target.value)}
                                    required
                                />
                                <InputError className="mt-2" message={basicProfileForm.errors.contact_person} />
                            </div>

                            <div>
                                <InputLabel htmlFor="contact_number" value="Contact Number" />
                                <TextInput
                                    id="contact_number"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={11}
                                    pattern="09[0-9]{9}"
                                    className="mt-1 block w-full rounded-2xl border-stone-300 bg-stone-50 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    value={basicProfileForm.data.contact_number}
                                    onChange={(e) => basicProfileForm.setData('contact_number', e.target.value)}
                                    required
                                />
                                <InputError className="mt-2" message={basicProfileForm.errors.contact_number} />
                            </div>

                            
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500">Location</label>
                                <p className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-500">
                                    Dumaguete City, Negros Oriental
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="barangay" className="block text-xs font-black uppercase tracking-[0.2em] text-stone-500">Barangay</label>
                                <BarangaySelect
                                    id="barangay"
                                    value={basicProfileForm.data.barangay || ''}
                                    onChange={handleBarangayChange}
                                    error={basicProfileForm.errors.barangay}
                                    required
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="street" value="Street / House No." />
                            <TextInput
                                id="street"
                                className="mt-1 block w-full rounded-2xl border-stone-300 bg-stone-50 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                value={basicProfileForm.data.street}
                                onChange={(e) => basicProfileForm.setData('street', e.target.value)}
                                placeholder="House / unit / street"
                                required
                            />
                            <InputError className="mt-2" message={basicProfileForm.errors.street} />
                        </div>

                        <div className="md:col-span-2 mt-2">
                            <InputLabel htmlFor="location_details" value="Landmark / Location Details (Optional)" />
                            <textarea
                                id="location_details"
                                className="mt-1 block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                value={basicProfileForm.data.location_details || ''}
                                onChange={(e) => basicProfileForm.setData('location_details', e.target.value)}
                                placeholder="e.g., Near the blue gate, behind the bakery..."
                                rows={2}
                            />
                            <InputError className="mt-2" message={basicProfileForm.errors.location_details} />
                        </div>
                            
                        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <div className="flex items-center gap-3">
                                    <FiMapPin className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-black text-stone-900">Map Location</p>
                                        <p className="text-xs text-stone-500">
                                            {basicProfileForm.data.latitude && basicProfileForm.data.longitude
                                                ? `${basicProfileForm.data.latitude}, ${basicProfileForm.data.longitude}`
                                                : 'No coordinates selected yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMapOpen(true)}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                            >
                                Pin Location on Map
                            </button>
                        </div>
                        <div className="space-y-1">
                            <InputError className="text-xs" message={basicProfileForm.errors.latitude} />
                            <InputError className="text-xs" message={basicProfileForm.errors.longitude} />
                        </div>

                        <div>
                            <InputLabel htmlFor="google_maps_link" value="Google Maps Link (Optional)" />
                            <TextInput
                                id="google_maps_link"
                                type="url"
                                className="mt-1 block w-full rounded-2xl border-stone-300 bg-stone-50 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                value={basicProfileForm.data.google_maps_link || ''}
                                onChange={(e) => basicProfileForm.setData('google_maps_link', e.target.value)}
                                placeholder="e.g., https://maps.app.goo.gl/..."
                            />
                            <p className="mt-2 text-xs font-medium text-stone-500">
                                Paste a link from Google Maps so customers can easily find your shop using Street View.
                            </p>
                            <InputError className="mt-2" message={basicProfileForm.errors.google_maps_link} />
                        </div>

                        <div>
                            <label htmlFor="logo" className="block text-sm font-bold text-stone-700 mb-2">Shop Logo (Optional)</label>
                            <p className="mb-2 text-xs font-medium text-stone-500">Makes your shop easy to find and recognized.</p>
                            <input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBasicLogoChange(e.target.files[0] || null)}
                                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orchid-50 file:text-orchid-700 hover:file:bg-orchid-100"
                            />
                            <InputError className="mt-2" message={basicProfileForm.errors.logo} />
                            {basicProfileLogoError && <p className="mt-2 text-xs font-semibold text-rose-600">{basicProfileLogoError}</p>}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <PrimaryButton disabled={basicProfileForm.processing || Boolean(basicProfileLogoError)}>
                                {basicProfileForm.processing ? 'Saving...' : 'Save & Continue'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            );
        }

        if (currentStep === 2) {
            return (
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">Step 2</p>
                        <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-950">Upload your legal documents</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                            Submit the required documents once so the super admin team can review and activate your shop.
                        </p>
                    </div>

                    {isRejected && (
                        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
                            Your application was rejected. Reason: {shop?.rejection_reason || 'No reason was provided.'} Please update your documents and resubmit.
                        </div>
                    )}

                    {(isUnderReview || isApproved) ? (
                        <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Government ID</p>
                                    <p className="mt-2 text-sm font-semibold text-stone-800">Received</p>
                                </div>
                                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">BIR / DTI</p>
                                    <p className="mt-2 text-sm font-semibold text-stone-800">Received</p>
                                </div>
                                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Review Status</p>
                                    <p className="mt-2 text-sm font-semibold text-stone-800">
                                        {isApproved ? 'Approved' : 'Under Review'}
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm leading-7 text-stone-600">
                                While you wait for approval, you can still prepare your shop structure from the dashboard after you return.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800"
                                >
                                    Continue to Services Setup ➔
                                </button>
                                <Link href="/store/dashboard" className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-700 transition-colors hover:bg-stone-50">
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={submitDocuments} encType="multipart/form-data" className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label htmlFor="document_gov_id" className="mb-2 block text-sm font-black text-stone-700">Government ID</label>
                                    <input
                                        id="document_gov_id"
                                        type="file"
                                        accept=".jpg,.png,.pdf"
                                        onChange={(e) => documentForm.setData('document_gov_id', e.target.files[0] || null)}
                                        className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                    />
                                    {documentForm.errors.document_gov_id && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.document_gov_id}</p>}
                                </div>

                                <div>
                                    <label htmlFor="document_bir" className="mb-2 block text-sm font-black text-stone-700">BIR 2303 (Certificate of Registration)</label>
                                    <input
                                        id="document_bir"
                                        type="file"
                                        accept=".jpg,.png,.pdf"
                                        onChange={(e) => documentForm.setData('document_bir', e.target.files[0] || null)}
                                        className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                    />
                                    {documentForm.errors.document_bir && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.document_bir}</p>}
                                </div>

                                <div>
                                    <label htmlFor="document_dti" className="mb-2 block text-sm font-black text-stone-700">DTI / Mayor's Permit</label>
                                    <input
                                        id="document_dti"
                                        type="file"
                                        accept=".jpg,.png,.pdf"
                                        onChange={(e) => documentForm.setData('document_dti', e.target.files[0] || null)}
                                        className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                    />
                                    {documentForm.errors.document_dti && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.document_dti}</p>}
                                </div>

                                <div className="md:col-span-2 flex flex-col gap-4 md:flex-row">
                                    <div className="w-full md:w-1/3">
                                        <label htmlFor="payout_method" className="mb-2 block text-sm font-black text-stone-700">Payment Method</label>
                                        <select
                                            id="payout_method"
                                            required
                                            value={documentForm.data.payout_method}
                                            onChange={(e) => documentForm.setData('payout_method', e.target.value)}
                                            className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                        >
                                            <option value="">Select payment method</option>
                                            <option value="GCash">GCash</option>
                                            <option value="Maya">Maya</option>
                                            <option value="BPI">BPI</option>
                                            <option value="BDO">BDO</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {documentForm.errors.payout_method && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.payout_method}</p>}
                                    </div>

                                    <div className="w-full md:w-2/3">
                                        <label htmlFor="payout_account" className="mb-2 block text-sm font-black text-stone-700">Account Number & Name</label>
                                        <input
                                            id="payout_account"
                                            type="text"
                                            maxLength={30}
                                            required
                                            value={documentForm.data.payout_account}
                                            onChange={(e) => documentForm.setData('payout_account', e.target.value)}
                                            className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                            placeholder="09123456789 - Juan Dela Cruz"
                                        />
                                        {documentForm.errors.payout_account && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.payout_account}</p>}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="document_qr_code" className="mb-2 block text-sm font-black text-stone-700">Payment QR Code / Proof (optional)</label>
                                    <input
                                        id="document_qr_code"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleDocumentQrChange(e.target.files[0] || null)}
                                        className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                                    />
                                    {documentForm.errors.document_qr_code && <p className="mt-2 text-xs font-semibold text-rose-600">{documentForm.errors.document_qr_code}</p>}
                                    {documentQrError && <p className="mt-2 text-xs font-semibold text-rose-600">{documentQrError}</p>}
                                </div>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                                <p className="text-sm font-black text-stone-900">Legal Agreements</p>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={documentForm.data.terms_accepted}
                                        onChange={(e) => documentForm.setData('terms_accepted', e.target.checked)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-stone-700">
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setActiveDoc({ key: 'terms_accepted', title: 'Terms of Service', url: '/documents/terms-and-condition.pdf' })}
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            Terms of Service
                                        </button>
                                    </span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={documentForm.data.dpa_accepted}
                                        onChange={(e) => documentForm.setData('dpa_accepted', e.target.checked)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-stone-700">
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setActiveDoc({ key: 'dpa_accepted', title: 'Data Processing Agreement', url: '/documents/privacy-policy.pdf' })}
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            Data Processing Agreement
                                        </button>
                                    </span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={documentForm.data.nda_accepted}
                                        onChange={(e) => documentForm.setData('nda_accepted', e.target.checked)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-stone-700">
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setActiveDoc({ key: 'nda_accepted', title: 'Mutual NDA', url: '/documents/mutual-nda.pdf' })}
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            Mutual NDA
                                        </button>
                                    </span>
                                </label>
                            </div>
                            {documentForm.errors.terms_accepted && <p className="text-xs font-semibold text-rose-600">{documentForm.errors.terms_accepted}</p>}
                            {documentForm.errors.dpa_accepted && <p className="text-xs font-semibold text-rose-600">{documentForm.errors.dpa_accepted}</p>}
                            {documentForm.errors.nda_accepted && <p className="text-xs font-semibold text-rose-600">{documentForm.errors.nda_accepted}</p>}

                            <div className="flex flex-wrap gap-3">
                                <PrimaryButton disabled={documentForm.processing || Boolean(documentQrError)}>
                                    {documentForm.processing ? 'Submitting...' : 'Submit Legal Documents'}
                                </PrimaryButton>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-700 transition-colors hover:bg-stone-50"
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            );
        }

        const stepSetup = {
            3: {
                description: 'Add the tailoring services you offer (e.g., Custom Suits, Alterations) and set your base prices.',
                primaryLabel: step3Completed ? 'Manage Services' : 'Go to Services Setup ➔',
                primaryHref: route('store.services.index') + '?from_onboarding=true',
                isDone: step3Completed,
            },
            4: {
                description: 'Stock your virtual shelves with the fabrics and materials you provide.',
                primaryLabel: step4Completed ? 'Manage Inventory' : 'Go to Inventory Setup ➔',
                primaryHref: route('store.inventory.index') + '?from_onboarding=true',
                isDone: step4Completed,
            },
            5: {
                description: "Set your shop's operating hours and booking slots.",
                primaryLabel: step5Completed ? 'Manage Schedule' : 'Go to Schedule Setup ➔',
                primaryHref: route('store.schedule.index') + '?from_onboarding=true#weekly-schedule',
                isDone: step5Completed,
            },
            6: {
                description: 'Review your setup progress and continue from the dashboard when ready.',
                primaryLabel: 'Go to Dashboard',
                primaryHref: route('store.dashboard'),
                isDone: false,
            },
        };

        const activeSetup = stepSetup[currentStep] || stepSetup[6];

        return (
            <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">Step {currentStep}</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{STEP_TITLES[currentStep - 1] || 'Setup step'}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                        {activeSetup.description}
                    </p>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
                    <div className="flex items-center gap-3 font-black text-stone-900">
                        <FiClock className="h-5 w-5 text-amber-600" />
                        Setup actions
                    </div>

                    <div className="mt-4 flex flex-col items-start gap-3">
                        {activeSetup.isDone && (
                            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                <FiCheckCircle className="h-4 w-4" /> Step Completed
                            </div>
                        )}
                        <Link
                            href={activeSetup.primaryHref}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800"
                        >
                            {activeSetup.primaryLabel}
                        </Link>

                        {currentStep < 6 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-600 transition-colors hover:bg-stone-100"
                            >
                                {activeSetup.isDone ? 'Proceed to Next Step ➔' : 'Skip for now ➔'}
                            </button>
                        ) : (
                            <Link
                                href={route('store.dashboard')}
                                className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-600 transition-colors hover:bg-stone-100"
                            >
                                Finish & Go to Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen overflow-hidden bg-gradient-to-br from-stone-50 via-white to-emerald-50">
            <Head title="Onboarding Wizard" />

            <div className="flex min-h-screen flex-col lg:flex-row">
                <aside className="w-full border-b border-stone-200 bg-slate-950 px-6 py-8 text-white lg:sticky lg:top-0 lg:h-screen lg:w-1/4 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
                    <div className="flex h-full flex-col">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Shop Setup</p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight">Onboarding Wizard</h1>
                            <p className="mt-3 text-sm leading-7 text-slate-300">
                                Follow the checklist from profile setup through review without leaving the onboarding flow.
                            </p>
                        </div>

                        <div className="mt-8 space-y-3">
                            {STEP_TITLES.map((title, index) => (
                                <button
                                    key={title}
                                    onClick={() => {
                                        // Allow navigation only if the step is not locked
                                        if (!isStepLocked(index)) {
                                            setCurrentStep(index + 1);
                                        }
                                    }}
                                    disabled={isStepLocked(index)}
                                    className="w-full text-left disabled:cursor-not-allowed"
                                >
                                    <StepPill
                                        number={index + 1}
                                        title={title}
                                        active={currentStep === index + 1}
                                        done={stepCompletionMap[index]}
                                        locked={isStepLocked(index)}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300 backdrop-blur">
                            <p className="font-black text-white">Progress</p>
                            <p className="mt-2">Step {currentStep} of 6</p>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-emerald-400 transition-all"
                                    style={{ width: `${(currentStep / 6) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto px-4 py-8 lg:h-screen lg:px-8 lg:py-10">
                    <div className="mx-auto max-w-5xl space-y-6">
                        {isRejected && (
                            <div className="rounded-3xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800 shadow-sm">
                                Your application was rejected. Reason: {shop?.rejection_reason || 'No reason was provided.'} Please update your documents and resubmit.
                            </div>
                        )}

                        {flashSuccess && (
                            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
                                {flashSuccess}
                            </div>
                        )}

                        {stepContent()}
                    </div>
                </main>
            </div>

            <MapPickerModal
                show={mapOpen}
                data={basicProfileForm.data}
                currentStreet={basicProfileForm.data.street}
                currentBarangay={basicProfileForm.data.barangay}
                initialLat={basicProfileForm.data.latitude}
                initialLng={basicProfileForm.data.longitude}
                searchQuery={basicProfileForm.data.street ? `${basicProfileForm.data.street}, ${basicProfileForm.data.barangay}` : basicProfileForm.data.barangay}
                onClose={() => setMapOpen(false)}
                onSave={handleMapSave}
            />

            <DocumentModal
                isOpen={!!activeDoc}
                onClose={() => setActiveDoc(null)}
                title={activeDoc?.title || 'Legal Document'}
                pdfUrl={activeDoc?.url || ''}
                onAgree={() => {
                    if (activeDoc?.key) {
                        documentForm.setData(activeDoc.key, true);
                        setActiveDoc(null);
                    }
                }}
            />
        </div>
    );
}