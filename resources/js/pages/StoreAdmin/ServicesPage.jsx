import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import ServicesManager from '@/Components/StoreAdmin/ServicesManager';
import { useMemo } from 'react';

export default function ServicesPage({ auth, shop, services, serviceCategories = [] }) {
    
    const getServiceCategoryName = (categoryId) => {
        if (!categoryId) return '-';
        const cat = serviceCategories.find(c => c.id === categoryId || c.id === parseInt(categoryId));
        return cat ? cat.name : categoryId;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Services Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <ServicesManager 
                        services={services}
                        serviceCategories={serviceCategories}
                        getServiceCategoryName={getServiceCategoryName}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
