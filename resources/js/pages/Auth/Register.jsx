import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'customer',
        shop_name: '',
    });

    const submit = (e) => {
        e.preventDefault();
console.log("Submitting form data:", data);
const payload = { ...data };
if (data.role !== 'store_admin') {
        delete payload.shop_name;
    }
    console.log("Cleaned Payload being sent:", payload);
        post(route('register'), {
            onBefore: () => console.log("Request starting..."),
        onSuccess: (page) => console.log("Success! Redirecting...", page),
        onError: (errors) => {
            console.error("Validation/Server Errors:", errors);
            // This will alert you if the server sends an error
            alert("Registration failed! Check console.");
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

                <div className="flex items-center gap-4 mt-6">
                    <p className="text-sm text-stone-600">
                        Already have an account? <Link href="/login" className="font-medium text-amber-600 hover:underline">Sign in</Link>
                    </p>
                </div>

                <div className="mt-6">
                    <PrimaryButton 
                    className="w-full"
                    type="submit"
                    disabled={processing}>
                        {processing ? 'Creating account…' : 'Register'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

