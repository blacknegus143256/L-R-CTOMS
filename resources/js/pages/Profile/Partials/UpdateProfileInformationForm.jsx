import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import BarangaySelect from '@/Components/BarangaySelect';
import MapPickerModal from '@/Components/MapPickerModal';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { getImageUploadError } from '@/utils/imageUpload';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [openMap, setOpenMap] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(
        user.profile?.avatar_url ? `/storage/${user.profile.avatar_url}` : null
    );
    const [avatarError, setAvatarError] = useState('');

const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            _method: 'patch', // Required for method spoofing
            name: user.name,
            email: user.email,
            avatar: null,
            phone: user.profile?.phone || '',
            barangay: user.profile?.barangay || '',
            street: user.profile?.street || '',
            location_details: user.profile?.location_details || '',
            latitude: user.profile?.latitude || '',
            longitude: user.profile?.longitude || '',
        });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const error = getImageUploadError(file);
            if (error) {
                setAvatarError(error);
                setData('avatar', null);
                return;
            }

            setAvatarError('');
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
            return;
        }

        setAvatarError('');
        setData('avatar', null);
    };

    const handleMapSave = ({ lat, lng, street }) => {
        setData((formData) => ({
            ...formData,
            latitude: lat ?? formData.latitude,
            longitude: lng ?? formData.longitude,
            // If the map returns a street, use it. Otherwise, keep what we had.
            street: street || formData.street,
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), { 
            preserveScroll: true 
        });
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
                <div className="flex items-center gap-6 mb-8">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-stone-200 shadow-sm shrink-0">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-3xl font-black uppercase">
                                {user.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <label 
                            htmlFor="avatar-upload" 
                            className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-sm transition-colors"
                        >
                            Change Picture
                        </label>
                        <input 
                            id="avatar-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAvatarChange} 
                        />
                        <p className="text-xs text-stone-500 mt-2 font-medium">JPG, PNG, GIF or WebP. Max size of 2MB.</p>
                        {avatarError && <p className="mt-2 text-xs font-semibold text-rose-600">{avatarError}</p>}
                    </div>
                </div>
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
                    <BarangaySelect
                        id="barangay"
                        value={data.barangay}
                        onChange={(val) => setData('barangay', val)}
                        error={errors.barangay}
                        className="mt-1 bg-stone-50 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                    />
                </div>
    
                <div className="relative">
                    <InputLabel htmlFor="street" value="Street / House No." />
                    <TextInput
                        id="street"
                        className="mt-1 block w-full bg-stone-50 pr-24 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.street}
                        onChange={(e) => setData('street', e.target.value)}
                        placeholder="House / unit / street"
                    />
                    <button
                        type="button"
                        onClick={() => setOpenMap(true)}
                        className="absolute right-1 bottom-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight bg-orchid-blue text-white rounded-lg hover:bg-orchid-purple transition-all"
                    >
                        Pin Map
                    </button>
                </div>

                <div className="md:col-span-2 mt-1">
                    <InputLabel htmlFor="location_details" value="Landmark / Location Details (Optional)" />
                    <textarea
                        id="location_details"
                        className="mt-1 block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20"
                        value={data.location_details}
                        onChange={(e) => setData('location_details', e.target.value)}
                        placeholder="e.g., Near the blue gate, behind the bakery..."
                        rows={2}
                    />
                    <InputError className="mt-2" message={errors.location_details} />
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
                    <PrimaryButton disabled={processing || Boolean(avatarError)}>Save</PrimaryButton>

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
            <MapPickerModal
                show={openMap}
                data={data}
                currentStreet={data.street}
                currentBarangay={data.barangay}
                initialLat={data.latitude}
                initialLng={data.longitude}
                searchQuery={data.street ? `${data.street}, ${data.barangay}` : data.barangay}
                onClose={() => setOpenMap(false)}
                onSave={handleMapSave}
            />
        </section>
    );
}
