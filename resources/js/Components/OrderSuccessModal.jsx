import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function OrderSuccessModal({ 
  isOpen, 
  order, 
  shop,
  onClose 
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  if (!isOpen || !order) return null;

  const orderNumber = order.id;
  const customerName = order.customer?.name || 'Valued Customer';
  const serviceName = order.orderServices?.[0]?.service?.service_name || 'Service';
  const totalAmount = order.total_amount || 0;
  const nextAppointment = order.appointments?.[0];

  const handleViewOrder = () => {
    setIsNavigating(true);
    router.get(`/my-orders/${order.id}`, {}, {
      preserveScroll: true,
      onFinish: () => setIsNavigating(false)
    });
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-black/50' : 'pointer-events-none bg-black/0'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-4 rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12 text-center text-white">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black mb-2">Order Submitted Successfully</h2>
          <p className="text-emerald-100 font-medium">Your order has been sent to the tailor</p>
        </div>

        {/* Order Details */}
        <div className="p-8 space-y-6">
          {/* Order Number Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-bold text-stone-600 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-3xl font-black text-indigo-600">#{orderNumber}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-600 uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-3xl font-black text-emerald-600">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-stone-900">Order Summary</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Service</p>
                <p className="text-base font-bold text-stone-900">{serviceName}</p>
              </div>
              
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Tailor Shop</p>
                <p className="text-base font-bold text-stone-900">{shop?.name || 'Professional Tailor'}</p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Customer</p>
                <p className="text-base font-bold text-stone-900">{customerName}</p>
              </div>

              {nextAppointment && (
                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Next Step</p>
                  <p className="text-base font-bold text-blue-900">Awaiting tailor review</p>
                </div>
              )}
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="text-base font-black text-blue-900 mb-3">What Happens Next</h4>
            <ol className="space-y-2 text-sm text-blue-900 font-medium">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-black text-xs">1</span>
                <span>The tailor will review your order and design requirements</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-black text-xs">2</span>
                <span>You'll receive a notification with the tailor's quote and timeline</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-black text-xs">3</span>
                <span>Once confirmed, work on your order will begin</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-stone-50 px-8 py-6 flex gap-4 border-t border-stone-200">
          <button
            onClick={handleContinue}
            className="flex-1 rounded-xl border-2 border-stone-300 py-3 px-6 font-bold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleViewOrder}
            disabled={isNavigating}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 px-6 font-black text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isNavigating ? 'Loading...' : 'View Order Details'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
