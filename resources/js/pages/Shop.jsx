import { useState, useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import OrderModal from "@/Components/OrderModal";

export default function Shop({ shop }) {
    if (!shop) return null;

    const { url } = usePage();
    const [showOrderForm, setShowOrderForm] = useState(false);

    useEffect(() => {
        if (url.includes('order=true')) {
            setShowOrderForm(true);
        }
    }, [url]);

    const [orderSuccess, setOrderSuccess] = useState(null);

    const services = shop.services || [];
    console.log(shop.attributes);
    // Group attributes by category
    const attributesByCategory = useMemo(() => {
        if (!shop?.attributes) return {};

        const grouped = {};

        shop.attributes.forEach(attr => {
            const categoryName = attr.attribute_category?.name || attr.attributeCategory?.name || "Other";

            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }

            grouped[categoryName].push(attr);
        });

        return grouped;
    }, [shop]);

    return (
        <div>

            <Link href="/" className="mb-4 inline-block text-sm text-stone-500">
                ← Back to shops
            </Link>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">{shop.shop_name}</h1>
            </div>

            <h2 className="mt-8 mb-3 text-lg font-semibold">Services</h2>

            {services.length === 0 ? (
                <p>No services listed.</p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                        <li key={s.id} className="border p-4 rounded">

                            <div className="mt-2 text-amber-600 font-semibold">
                                {s.service_name}
                            </div>
                            <div className="text-sm text-stone-500">
                            Category: {s.service_category?.name || "General"}
                            </div>
                            <div className="mt-2 font-medium">Description: {s.service_description}</div>
                            <div className="mt-2 font-medium">Duration: {s.duration_days} days</div>
                            <div className="mt-2 font-medium">Status: {s.is_available ? "Available" : "Not Available"}</div>
                            <div className="mt-2 font-medium">Rush Service: {s.rush_service_available ? "Available" : "Not Available"}</div>
                            <div className="mt-2 font-medium">Appointment: {s.appointment_required ? "Required" : "No"}</div>
                            <div className="mt-2 font-medium">Note: {s.notes}</div>
                            <div>
                                ₱{Number(s.price).toFixed(2)}
                            </div>

                        </li>
                    ))}
                </ul>
            )}

            {Object.keys(attributesByCategory).length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Customization Options
                    </h2>

                    {Object.entries(attributesByCategory).map(([categoryName, attrs]) => (
                        <div key={categoryName} className="mb-6">

                            <h3 className="font-medium text-lg mb-2">
                                {categoryName}
                            </h3>

                            <ul className="space-y-1">
                                {attrs.map(attr => (
                                    <li key={attr.id} className="flex justify-between margin-2 rounded border p-3">

                                        <span>{attr.name}</span>

{attr.pivot?.item_name || attr.name}
                                        <span>
                                            {attr.pivot?.price
                                                ? `+₱${Number(attr.pivot.price).toFixed(2)}`
                                                : "Free"}
                                        </span>

                                    </li>
                                ))}
                            </ul>

                        </div>
                    ))}
                </div>
            )}

            <OrderModal
                shop={shop}
                isOpen={showOrderForm}
                onClose={() => setShowOrderForm(false)}
            />

            <button
                onClick={() => setShowOrderForm(true)}
                className="fixed bottom-6 right-6 z-40 rounded-full bg-amber-600 px-6 py-3 text-white shadow-lg hover:bg-amber-700"
            >
                Place Order
            </button>

        </div>
    );
}

