import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import InventoryAssetsManager from '@/Components/StoreAdmin/InventoryAssetsManager';

export default function Inventory({ auth, categories, shopAttributes, attributeTypes = [] }) {
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
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
