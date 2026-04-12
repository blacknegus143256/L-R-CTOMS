import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import MapLibrePicker from "@/Components/MapLibrePicker";
import { FiX } from 'react-icons/fi';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const [openMap, setOpenMap] = useState(false);
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.profile?.phone || '',
            barangay: user.profile?.barangay || '',
            street: user.profile?.street || '',
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-black text-stone-900 tracking-tight">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-10 space-y-10">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full bg-stone-50 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full bg-stone-50 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>
                <div>
                <InputLabel htmlFor="phone" value="Phone" />
                    <TextInput
                        id="phone"
                        type="text"
                        inputMode="numeric"
                        maxLength={11}
                        className="mt-1 block w-full bg-stone-50 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                <InputError message={errors.phone} className="mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <InputLabel htmlFor="barangay" value="Barangay" />
                    <TextInput
                        id="barangay"
                        className="mt-1 block w-full bg-stone-50 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.barangay}
                        onChange={(e) => setData('barangay', e.target.value)}
                    />
                </div>
    
                <div className="relative">
                    <InputLabel htmlFor="street" value="Street" />
                    <TextInput
                        id="street"
                        className="mt-1 block w-full bg-stone-50 pr-24 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.street}
                        onChange={(e) => setData('street', e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setOpenMap(true)}
                        className="absolute right-1 bottom-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight bg-orchid-blue text-white rounded-lg hover:bg-orchid-purple transition-all"
                    >
                        Pin Map
                    </button>
                </div>
            </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orchid-blue focus:ring-offset-2"
                        >
                            Click here to re-send the verification email.
                        </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
            {openMap && (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="flex items-center justify-between p-3 px-5 border-b border-stone-200 shrink-0">
                            <h3 className="text-xl font-black text-stone-800">
                             Select Your Location
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpenMap(false)}
                                className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900 rounded-xl transition-colors"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-stone-50/50">
                    <MapLibrePicker data={data} setData={setData} />
        </div>
                    <div className="p-3 px-5 border-t border-stone-200 bg-white shrink-0 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setOpenMap(false)}
                                className="px-5 py-2 font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpenMap(false)}
                                className="px-6 py-2 font-black text-white bg-gradient-to-r from-orchid-blue to-orchid-purple hover:shadow-lg hover:shadow-orchid-blue/30 rounded-xl transition-all"
                            >
                                Confirm Location
                            </button>
                        </div>
                </div>
            </div>
        )}
        </section>
    );
}
