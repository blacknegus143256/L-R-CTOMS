import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { useForm, usePage } from '@inertiajs/react';

export default function OrderModal({ shop, isOpen, onClose, onSuccess }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        service_id: '',
        attributes: [],
        notes: '',
    });

    const [step, setStep] = useState(1); // 1: select attributes, 2: confirm
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profileCheckLoading, setProfileCheckLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(true);
    const [selectedServiceId, setSelectedServiceId] = useState('');

    const { auth } = usePage().props; // Get auth data from Inertia
    // Compute the selected service
    const service = shop?.services?.find(
        s => String(s.id) === String(selectedServiceId)
    ) || null;

    // Group attributes by category
    const attributesByCategory = useMemo(() => {
        if (!shop?.attributes) return {};
        
        const grouped = {};
        shop.attributes.forEach(attr => {
            const categoryName = attr.attribute_category?.name || 'Other';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];56
            }
            grouped[categoryName].push(attr);
        });
        return grouped;
    }, [shop?.attributes]);

    // Calculate total price
    const totalPrice = useMemo(() => {
        let total = Number(service?.price) || 0;
        
        selectedAttributes.forEach(attrId => {
            const attr = shop?.attributes?.find(a => a.id === attrId);
            if (attr?.pivot?.price) {
                total += Number(attr.pivot.price);
            }
        });
        
        return total;
    }, [service?.price, selectedAttributes, shop?.attributes]);

    // Check user profile on mount
    useEffect(() => {
    if (isOpen) {
        setProfileCheckLoading(true);
        
        if (!auth?.user) {
            setProfileComplete(false);
            setError("Please login to place an order.");
        } else {
            // Logic: Check if the profile object exists AND if the fields are not null/empty
            const userProfile = auth.user.profile;
            
            const hasPhone = !!userProfile?.phone;
            const hasBarangay = !!userProfile?.barangay;
            const hasStreet = !!userProfile?.street; // Based on your DB, some are NULL

            if (hasPhone && hasBarangay || hasStreet) {
                setProfileComplete(true);
                setError(null);
            } else {
                setProfileComplete(false);
                setError("Please complete your profile details (Phone/Address) to continue.");
            }
        }
        setProfileCheckLoading(false);
    }
}, [isOpen, auth]);

    // Reset state when service changes
    useEffect(() => {
        if (service) {
            setSelectedAttributes([]);
            setNotes('');
            setStep(1);
            setError(null);
        }
    }, [service]);

    useEffect(() => {
        setData('service_id', selectedServiceId);
    }, [selectedServiceId]);

    const toggleAttribute = (attrId) => {
        setSelectedAttributes(prev => 
            prev.includes(attrId) 
                ? prev.filter(id => id !== attrId)
                : [...prev, attrId]
        );
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!service) {
        setError('Please select a service first.');
        return;
    }
    
    setError(null);
    setLoading(true);

    // Sync the local component state to the useForm 'data' object right before sending
    setData(prev => ({
        ...prev,
        attributes: selectedAttributes,
        notes: notes
    }));

    // Use the post method from useForm
    // Ensure this route matches a POST route in your web.php
    post(`/shops/${shop.id}/orders`, {
        preserveScroll: true,
        onSuccess: () => {
            reset();
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            setLoading(false);
            console.log("Database/Validation Error:", err);
            setError("Failed to save order. Please check your inputs.");
        },
        onFinish: () => setLoading(false),
    });
};

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-stone-200 p-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-stone-800">
                            {step === 1 ? 'Customize Your Order' : 'Confirm Order'}
                        </h2>
                        <p className="mt-1 text-stone-600">{service ? service.service_name : "Select a service"}</p>
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

                {/* Loading Profile Check */}
                {profileCheckLoading && (
                    <div className="p-6">
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                        </div>
                    </div>
                )}

                {/* Step 1: Select Attributes */}
                {!profileCheckLoading && step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                        <div className="p-6">
                            {/* Error Message */}
                            {error && !profileComplete && (
                                <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-700 border border-amber-200">
                                    <div className="font-medium">{error}</div>
                                    <button
                                        type="button"
                                        onClick={() => router.get(route('profile.edit'))}
                                        className="mt-2 text-sm underline hover:text-amber-800"
                                    >
                                        Go to Profile →
                                    </button>
                                </div>
                            )}

                            {/* Service Selection */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-stone-700">
                                    Select Service
                                </label>

                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    <option value="">Choose a service</option>

                                    {shop.services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {/* Shows: Hemming [Repair] — ₱150.00 */}
                                        {s.service_name} [{s.service_category?.name || 'General'}] — ₱{Number(s.price || 0).toFixed(2)}
                                    </option>
                                ))}
                                </select>
                            </div>

                            {/* Base Price */}
                            <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-700">Base Service Price</span>
                                    <span className="text-xl font-semibold text-amber-700">
                                        ₱{Number(service?.price || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Attribute Options */}
                            {Object.keys(attributesByCategory).length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(attributesByCategory).map(([category, attrs]) => (
                                        <div key={category}>
                                            <h3 className="mb-3 font-medium text-stone-800">{category}</h3>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {attrs.map(attr => {
                                                    const isSelected = selectedAttributes.includes(attr.id);
                                                    const price = attr.pivot?.price || 0;
                                                    
                                                    return (
                                                        <label
                                                            key={attr.id}
                                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                                isSelected 
                                                                    ? 'border-amber-500 bg-amber-50' 
                                                                    : 'border-stone-200 hover:border-stone-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAttribute(attr.id)}
                                                                className="h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                                            />
                                                            <div className="flex-1">

                                                                <div className="font-medium text-stone-800">
                                                                    {attr.pivot?.item_name || attr.name}
                                                                </div>

                                                                {attr.pivot?.notes && (
                                                                    <div className="text-xs text-stone-500">{attr.pivot.notes}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-amber-700 font-medium">
                                                                {price > 0 ? `+₱${Number(price).toFixed(2)}` : 'Free'} - {attr.pivot.unit}
                                                            </div>
                                                            <div className="sr-only">{attr.pivot?.unit}</div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-stone-500">No additional options available for this service.</p>
                            )}

                            {/* Notes */}
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-stone-700">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            {/* Total & Next Button */}
                            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
                                <div>
                                    <div className="text-sm text-stone-500">Total</div>
                                    <div className="text-2xl font-bold text-amber-700">
                                        ₱{totalPrice.toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!selectedServiceId}
                                    className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Step 2: Confirm Order */}
                {!profileCheckLoading && step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
                                    {error}
                                </div>
                            )}

                            {/* Order Summary */}
                            <div className="rounded-lg bg-stone-50 p-4">
                                <h3 className="font-medium text-stone-800 mb-3">Order Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Service</span>
                                        <span className="text-stone-800">{service?.service_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Base Price</span>
                                        <span className="text-stone-800">₱{Number(service?.price || 0).toFixed(2)}</span>
                                    </div>
                                    
                                    {selectedAttributes.length > 0 && (
                                        <>
                                            <div className="border-t border-stone-200 pt-2 mt-2">
                                                <span className="text-stone-600">Selected Options:</span>
                                            </div>
                                            {selectedAttributes.map(attrId => {
                                                const attr = shop?.attributes?.find(a => a.id === attrId);
                                                const price = attr?.pivot?.price || 0;
                                                return (
                                                    <div key={attrId} className="flex justify-between pl-2">
                                                        <span className="text-stone-600">+ {attr?.pivot?.item_name || attr?.name}</span>
                                                        <span className="text-stone-800">₱{Number(price).toFixed(2)}</span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                    
                                    {notes && (
                                        <div className="border-t border-stone-200 pt-2 mt-2">
                                            <div className="text-stone-600">Notes:</div>
                                            <div className="text-stone-800 text-right">{notes}</div>
                                        </div>
                                    )}
                                    
                                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                                        <span className="text-stone-800">Total</span>
                                        <span className="text-amber-700">₱{totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Notice */}
                            {!profileComplete && (
                                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-700 border border-amber-200 text-sm">
                                    Your order will be linked to your account. Please ensure your profile is complete.
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !profileComplete}
                                    className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Placing Order...' : 'Confirm Order'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

