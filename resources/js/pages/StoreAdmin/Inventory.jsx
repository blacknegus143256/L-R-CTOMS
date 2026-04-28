import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import InventoryAssetsManager from '@/Components/StoreAdmin/InventoryAssetsManager';
import Modal from '@/Components/Modal';
import { useState } from 'react';

export default function Inventory({ auth, categories, shopAttributes, attributeTypes = [] }) {
    const [showReturnModal, setShowReturnModal] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const isFromOnboarding = urlParams.get('from_onboarding') === 'true';

    const handleSaved = () => {
        if (isFromOnboarding) {
            setShowReturnModal(true);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Inventory Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <InventoryAssetsManager 
                        categories={categories}
                        shopAttributes={shopAttributes}
                        attributeTypes={attributeTypes}
                        auth={auth}
                        onSaved={handleSaved}
                    />
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
