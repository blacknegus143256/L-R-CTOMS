import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status= {} }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
<div className="max-w-3xl mx-auto space-y-8 sm:px-6 lg:px-8">
                    {/* Top Row: Symmetrical Grid */}
        {/* Top Row: Info and Security (Symmetrical Grid) */}
            <div className="bg-white/80 backdrop-blur-md p-8 shadow-2xl shadow-stone-200/50 rounded-[2rem] border border-stone-100">
                <UpdateProfileInformationForm 
                    mustVerifyEmail={mustVerifyEmail} 
                    status={status} 
                />
            </div>

            <div className="bg-white/80 backdrop-blur-md p-8 shadow-2xl shadow-stone-200/50 rounded-[2rem] border border-stone-100">
                <UpdatePasswordForm />
            </div>
        </div>
          {/* Danger Zone: Centered */}
        {/* Danger Zone */}
        <div className="max-w-xl mx-auto opacity-50 hover:opacity-100 transition-opacity">
            <DeleteUserForm />
        </div>
                </div>
        </AuthenticatedLayout>
    );
}

