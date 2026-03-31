import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateMeasurementsForm from './Partials/UpdateMeasurementsForm';

export default function Edit({ mustVerifyEmail, status, profileMeasurements = {} }) {
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
<div className="max-w-7xl mx-auto space-y-8 sm:px-6 lg:px-8">
                    {/* Top Row: Symmetrical Grid */}
        {/* Top Row: Info and Security (Symmetrical Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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

                    {/* Full Width: Tailoring Measurements Library */}
        {/* Bottom Section: The Tailoring Profile (Full Width) */}
        <div className="bg-white p-10 shadow-2xl shadow-orchid-purple/5 rounded-[2.5rem] border border-stone-200/60">
            <UpdateMeasurementsForm profileMeasurements={profileMeasurements} />
        </div>

                    {/* Danger Zone: Centered */}
        {/* Danger Zone */}
        <div className="max-w-xl mx-auto opacity-50 hover:opacity-100 transition-opacity">
            <DeleteUserForm />
        </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

