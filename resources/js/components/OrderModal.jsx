import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function OrderModal({ shop, service, isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: select attributes, 2: customer info
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Customer info
    const [customerMode, setCustomerMode] = useState('new'); // 'new' or 'existing'
    const [existingCustomerId, setExistingCustomerId] = useState('');
    const [customers, setCustomers] = useState([]);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    // Group attributes by category
    const attributesByCategory = useMemo(() => {
        if (!shop?.attributes) return {};
        
        const grouped = {};
        shop.attributes.forEach(attr => {
            const categoryName = attr.attribute_category?.name || 'Other';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
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

    // Load customers when modal opens
    useEffect(() => {
        if (isOpen && shop?.id) {
            // Try to load customers for this shop
            axios.get(`/api/dashboard/shops/${shop.id}/customers`)
                .then(res => setCustomers(res.data.data || []))
                .catch(() => setCustomers([]));
        }
    }, [isOpen, shop?.id]);

    // Reset state when service changes
    useEffect(() => {
        if (service) {
            setSelectedAttributes([]);
            setNotes('');
            setStep(1);
            setError(null);
            setCustomerMode('new');
            setExistingCustomerId('');
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
        }
    }, [service]);

    const toggleAttribute = (attrId) => {
        setSelectedAttributes(prev => 
            prev.includes(attrId) 
                ? prev.filter(id => id !== attrId)
                : [...prev, attrId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = {
                service_id: service.id,
                attributes: selectedAttributes,
                notes: notes || null,
            };

            if (customerMode === 'existing' && existingCustomerId) {
                payload.customer_id = parseInt(existingCustomerId);
            } else {
                payload.customer_name = newCustomer.name;
                payload.customer_phone = newCustomer.phone || null;
                payload.customer_email = newCustomer.email || null;
                payload.customer_address = newCustomer.address || null;
            }

            const response = await axios.post(`/api/shops/${shop.id}/orders`, payload);
            
            if (onSuccess) {
                onSuccess(response.data.data);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !service) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-stone-200 p-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-stone-800">
                            {step === 1 ? 'Customize Your Order' : 'Your Information'}
                        </h2>
                        <p className="mt-1 text-stone-600">{service.service_name}</p>
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

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Select Attributes */}
                    {step === 1 && (
                        <div className="p-6">
                            {/* Base Price */}
                            <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-700">Base Service Price</span>
                                    <span className="text-xl font-semibold text-amber-700">
                                        ₱{Number(service.price).toFixed(2)}
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
                                                                {price > 0 ? `+₱${Number(price).toFixed(2)}` : 'Free'}
                                                            </div>
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
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Customer Info */}
                    {step === 2 && (
                        <div className="p-6">
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
                                    {error}
                                </div>
                            )}

                            {/* Customer Mode Toggle */}
                            {customers.length > 0 && (
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-stone-700">
                                        Customer
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="customerMode"
                                                value="new"
                                                checked={customerMode === 'new'}
                                                onChange={() => setCustomerMode('new')}
                                                className="h-4 w-4 border-stone-300 text-amber-600"
                                            />
                                            <span className="text-stone-700">New Customer</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="customerMode"
                                                value="existing"
                                                checked={customerMode === 'existing'}
                                                onChange={() => setCustomerMode('existing')}
                                                className="h-4 w-4 border-stone-300 text-amber-600"
                                            />
                                            <span className="text-stone-700">Existing Customer</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Existing Customer Dropdown */}
                            {customerMode === 'existing' && customers.length > 0 && (
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-stone-700">
                                        Select Customer
                                    </label>
                                    <select
                                        value={existingCustomerId}
                                        onChange={(e) => setExistingCustomerId(e.target.value)}
                                        className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="">— Select a customer —</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* New Customer Form */}
                            {(customerMode === 'new' || customers.length === 0) && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-stone-700">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-stone-700">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                placeholder="09XX XXX XXXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-stone-700">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newCustomer.email}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-stone-700">
                                            Address
                                        </label>
                                        <textarea
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                            rows={2}
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            placeholder="Your delivery address"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Order Summary */}
                            <div className="mt-6 rounded-lg bg-stone-50 p-4">
                                <h3 className="font-medium text-stone-800 mb-3">Order Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Service</span>
                                        <span className="text-stone-800">{service.service_name}</span>
                                    </div>
                                    {selectedAttributes.length > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-600">Options</span>
                                            <span className="text-stone-800">{selectedAttributes.length} selected</span>
                                        </div>
                                    )}
                                    {notes && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-600">Notes</span>
                                            <span className="text-stone-800 text-right max-w-[200px] truncate">{notes}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-stone-200 pt-2 flex justify-between">
                                        <span className="font-medium text-stone-700">Total</span>
                                        <span className="font-bold text-amber-700">₱{totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

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
                                    disabled={loading || (customerMode === 'existing' && !existingCustomerId) || (customerMode === 'new' && !newCustomer.name)}
                                    className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Placing Order...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

