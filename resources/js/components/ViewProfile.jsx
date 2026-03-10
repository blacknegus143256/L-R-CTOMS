import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function ViewProfile({ shop, onClose, onPlaceOrder }) {
    if (!shop) return null;
    
    // Detect whether the user is logged in
    const { auth } = usePage().props;
    const user = auth?.user || null;
    
    // Create state for the login/register modal
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [actionName, setActionName] = useState('');
    
    // Initialize the useRequireAuth hook
    const requireAuth = useRequireAuth(setShowAuthModal, setActionName);
    
    const userprofile = shop.userprofile || {};
    const services = shop.services || [];
    const attributes = shop.attributes || [];

    // Create the button click handler
    const handleProtectedAction = (action) => {
        if (!user) {
            setActionName(action);
            setShowAuthModal(true);
            return;
        }

        window.location.href = `/shop/${shop.id}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl">
                <div className="p-6">
                    {/* Shop Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-stone-800">{shop.shop_name}</h2>
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
                        <button
                            onClick={onClose}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Brief Services Section */}
                    {services.length > 0 && (
                        <div className="mt-6">
                            <h3 className="mb-3 text-lg font-semibold text-stone-800">Services</h3>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {services.slice(0, 4).map((s) => (
                                    <li key={s.id} className="rounded-lg border border-stone-200 p-3">
                                        <div className="font-medium text-stone-800">{s.service_category.name}</div>
                                        <div className="mt-1 text-stone-600">
                                            ₱{Number(s.price).toFixed(2)}
                                            {s.duration && ` · ${s.duration}`}
                                        </div>
                                    </li>
                                ))}
                                {services.length > 4 && (
                                    <li className="rounded-lg border border-stone-200 p-3 text-center text-stone-500">
                                        +{services.length - 4} more services
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Brief Attributes Section */}
                    {attributes.length > 0 && (
                        <div className="mt-6">
                            <h3 className="mb-3 text-lg font-semibold text-stone-800">Attributes</h3>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {attributes.slice(0, 4).map((attr) => (
                                    <li key={attr.id} className="rounded-lg border border-stone-200 p-3">
                                        <div className="font-medium text-stone-800">{attr.name}</div>
                                        {attr.pivot && (
                                            <div className="mt-1 text-stone-600">
                                                ₱{Number(attr.pivot.price).toFixed(2)} {attr.pivot.unit || ''}
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {attributes.length > 4 && (
                                    <li className="rounded-lg border border-stone-200 p-3 text-center text-stone-500">
                                        +{attributes.length - 4} more attributes
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() =>
                                requireAuth(
                                    'view this shop',
                                    `/shop/${shop.id}`
                                )
                            }
                            className="rounded-lg border border-stone-300 px-6 py-3 text-base font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
                        >
                            View Shop
                        </button>
                        <button
                            onClick={() =>
                                requireAuth(
                                    'place an order',
                                    `/shop/${shop.id}?order=true`
                                )
                            }
                            className="rounded-lg bg-amber-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        >
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Login/Register Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-stone-800">
                            Authentication Required
                        </h3>
                        <p className="mt-2 text-stone-600">
                            You must log in or register to {actionName}.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="rounded-lg border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <Link
                                href="/register"
                                className="rounded-lg border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
                            >
                                Register
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
