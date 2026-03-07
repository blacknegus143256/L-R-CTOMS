import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import OrderModal from '@/components/OrderModal';

export default function Shop() {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Order modal state
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);

    useEffect(() => {
        if (!id) return;
        axios
            .get(`/api/shops/${id}`)
            .then((res) => setShop(res.data.data))
            .catch((err) => setError(err.response?.status === 404 ? 'Shop not found.' : err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
        );
    }

    if (error || !shop) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {error || 'Shop not found.'}
                <Link to="/" className="ml-2 underline">Back to shops</Link>
            </div>
        );
    }

    const services = shop.services || [];

    return (
        <div>
            <Link to="/" className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-700">
                ← Back to shops
            </Link>
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-800">{shop.shop_name}</h1>
                        {shop.contact_person && (
                            <p className="mt-1 text-stone-600">Contact: {shop.contact_person}</p>
                        )}
                        {shop.address && (
                            <p className="text-stone-500">{shop.address}</p>
                        )}
                        {shop.contact_number && (
                            <p className="text-stone-600">{shop.contact_number}</p>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="mt-8 mb-3 text-lg font-semibold text-stone-800">Services</h2>
            {services.length === 0 ? (
                <p className="text-stone-500">No services listed.</p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                        <li
                            key={s.id}
                            className="rounded-lg border border-stone-200 bg-white p-4"
                        >
                            <div className="font-medium text-stone-800">{s.service_name}</div>
                            <div className="mt-1 text-stone-600">
                                ₱{Number(s.price).toFixed(2)}
                                {s.duration_days && ` · ${s.duration_days} days`}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedService(s);
                                    setOrderModalOpen(true);
                                }}
                                className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700"
                            >
                                Order Now
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Order Modal */}
            <OrderModal
                shop={shop}
                service={selectedService}
                isOpen={orderModalOpen}
                onClose={() => {
                    setOrderModalOpen(false);
                    setSelectedService(null);
                }}
                onSuccess={(order) => {
                    setOrderSuccess(order);
                    setTimeout(() => setOrderSuccess(null), 5000);
                }}
            />

            {/* Success Message */}
            {orderSuccess && (
                <div className="fixed bottom-4 right-4 rounded-lg bg-green-600 p-4 text-white shadow-lg">
                    <div className="font-medium">Order placed successfully!</div>
                    <div className="text-sm">Order #{orderSuccess.id} - ₱{Number(orderSuccess.total_price).toFixed(2)}</div>
                </div>
            )}
        </div>
    );
}
