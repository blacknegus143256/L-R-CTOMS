import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { showAlert } from '@/utils/alert';
import React, { useEffect, useState } from 'react';
import DocumentModal from '@/Components/DocumentModal';
export default function Register() {
    const redirectUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
    const [activeDoc, setActiveDoc] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'customer',
        shop_name: '',
        terms: false,
    });

    const submit = (e) => {
        e.preventDefault();
console.log("Submitting form data:", data);
const payload = { ...data };
if (data.role !== 'store_admin') {
        delete payload.shop_name;
    }
    console.log("Cleaned Payload being sent:", payload);
        const target = redirectUrl ? `${route('register')}?redirect=${encodeURIComponent(redirectUrl)}` : route('register');

        post(target, {
            onBefore: () => console.log("Request starting..."),
        onSuccess: (page) => console.log("Success! Redirecting...", page),
        onError: (errors) => {
            console.error("Validation/Server Errors:", errors);

            const errorMessage = Object.values(errors || {})
                .flatMap((v) => (Array.isArray(v) ? v : [v]))
                .join(' ');

            // Show a clearer registration error message to the user
            showAlert({
                title: 'Registration Error',
                message: errorMessage || 'Registration failed. Please check your input.',
                type: 'error',
            });
        },
        data: payload,
        onFinish: () => {
            console.log("Request finished.");
            reset('password', 'password_confirmation');
        },
    });
    };

    // Clear shop_name when role changes to non-store_admin
    useEffect(() => {
        if (data.role !== 'store_admin') {
            setData('shop_name', '');
        }
    }, [data.role, setData]);

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div className="mb-4">
                    <InputLabel htmlFor="role" value="Register As" />
                    
                    <select
                        id="role"
                        name="role"
                        value={data.role}
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        onChange={(e) => setData('role', e.target.value)}
                    >
                        <option value="customer">Customer</option>
                        <option value="store_admin">Store Admin</option>
                    </select>

                    <InputError message={errors.role} className="mt-2" />

                    {data.role === 'store_admin' && (
                        <div className="mt-4">
                            <InputLabel htmlFor="shop_name" value="Shop Name" />

                            <TextInput
                                id="shop_name"
                                name="shop_name"
                                value={data.shop_name}
                                className="mt-1 block w-full"
                                autoComplete="shop-name"
                                onChange={(e) => setData('shop_name', e.target.value)}
                                required
                            />

                            <InputError message={errors.shop_name} className="mt-2" />
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>
                {/* <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                                <p className="text-sm font-black text-stone-900">Legal Agreements</p>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.terms_accepted}
                                        onChange={(e) => setData('terms_accepted', e.target.checked)}
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
                                        checked={data.dpa_accepted}
                                        onChange={(e) => setData('dpa_accepted', e.target.checked)}
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
                                        checked={data.nda_accepted}
                                        onChange={(e) => setData('nda_accepted', e.target.checked)}
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
                            {errors.terms_accepted && <p className="text-xs font-semibold text-rose-600">{errors.terms_accepted}</p>}
                            {errors.dpa_accepted && <p className="text-xs font-semibold text-rose-600">{errors.dpa_accepted}</p>}
                            {errors.nda_accepted && <p className="text-xs font-semibold text-rose-600">{errors.nda_accepted}</p>} */}

                <div className="mt-6">
                    <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                        <label className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={data.terms}
                                onChange={(e) => setData('terms', e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-stone-700">
                                I agree to the{' '}
                                <button
                                    type="button"
                                    onClick={() => setActiveDoc({ key: 'terms', title: 'Terms & Conditions', url: '/documents/terms-and-condition.pdf' })}
                                    className="font-bold text-blue-600 hover:underline"
                                >
                                    Terms & Conditions
                                </button>{' '}
                                and{' '}
                                <button
                                    type="button"
                                    onClick={() => setActiveDoc({ key: 'privacy', title: 'Privacy Policy', url: '/documents/privacy-policy.pdf' })}
                                    className="font-bold text-blue-600 hover:underline"
                                >
                                    Privacy Policy
                                </button>
                                .
                            </span>
                        </label>

                        {errors.terms && <p className="text-xs font-semibold text-rose-600">{errors.terms}</p>}
                    </div>

                    <PrimaryButton
                        className="w-full"
                        type="submit"
                        disabled={processing || !data.terms}
                    >
                        {processing ? 'Creating account…' : 'Register'}
                    </PrimaryButton>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                    <p className="text-sm text-stone-500">
                        Already a member?{' '}
                        <Link
                            href={redirectUrl ? `${route('login')}?redirect=${encodeURIComponent(redirectUrl)}` : route('login')}
                            className="font-bold text-orchid-purple hover:text-orchid-blue transition-colors duration-200 underline underline-offset-4"
                        >
                            Sign In Here
                        </Link>
                    </p>
                </div>
            </form>
            <DocumentModal
                            isOpen={!!activeDoc}
                            onClose={() => setActiveDoc(null)}
                            title={activeDoc?.title || 'Legal Document'}
                            pdfUrl={activeDoc?.url || ''}
                            onAgree={() => {
                                if (activeDoc?.key) {
                                    setData(activeDoc.key, true);
                                    setActiveDoc(null);
                                }
                            }}
                        />
        </GuestLayout>
    );
}

