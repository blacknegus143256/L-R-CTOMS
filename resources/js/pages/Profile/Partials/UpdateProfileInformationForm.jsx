import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import MapLibrePicker from "@/Components/MapLibrePicker";
import { useState } from "react";


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
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
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
                        className="mt-1 block w-full"
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
                    className="mt-1 block w-full"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                />
                <InputError message={errors.phone} className="mt-2" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <InputLabel htmlFor="barangay" value="Barangay" />
                    <TextInput
                        id="barangay"
                        value={data.barangay}
                        onChange={(e) => setData('barangay', e.target.value)}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="street" value="Street" />
                    <TextInput
                        id="street"
                        value={data.street}
                        onChange={(e) => setData('street', e.target.value)}
                    />
                </div>
                <button
                type="button"
                onClick={() => setOpenMap(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Set Location from Map
            </button>
            </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white w-3/4 h-3/4 rounded-xl p-4 relative">
                    
                    <button
                        onClick={() => setOpenMap(false)}
                        className="absolute top-2 right-2 text-gray-600"
                    >
                        ✕
                    </button>
        
                    <h3 className="text-lg font-semibold mb-2">
                        Select Location
                    </h3>
        
                    <MapLibrePicker data={data} setData={setData} />
        
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpenMap(false)}
                            className="px-4 py-2 bg-green-600 text-white rounded"
                        >
                            Save Location
                        </button>
                    </div>
                </div>
            </div>
        )}
        </section>
    );
}
