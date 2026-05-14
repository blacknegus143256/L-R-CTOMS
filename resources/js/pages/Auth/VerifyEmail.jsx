import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ auth, status, verificationCode }) {
    const { user } = auth;
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.code'), {
            onSuccess: () => reset('code'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-4 text-sm text-gray-600">
                Thanks for signing up! We've sent a 6-digit code to{' '}
                <strong className="text-orchid-purple font-semibold">{user.email}</strong>
                . Enter it below to verify your account.
            </div>

            {status === 'verification-code-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification code has been sent to the email address you provided during registration.
                </div>
            )}

            {verificationCode && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-bold">Verification code available in the app</p>
                    <p className="mt-1">
                        Your code is <span className="font-black tracking-[0.35em]">{verificationCode}</span>.
                    </p>
                    <p className="mt-1 text-xs font-medium text-amber-700">
                        This fallback appears when email delivery is unavailable on the deployed environment.
                    </p>
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="code" value="Verification Code" />

                    <TextInput
                        id="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        className="mt-1 block w-full tracking-[0.35em] text-center text-lg font-bold"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />

                    <InputError message={errors.code} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Verifying...' : 'Verify Code'}
                    </PrimaryButton>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('verification.code.send')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Resend Code
                        </Link>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
