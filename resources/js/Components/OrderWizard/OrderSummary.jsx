import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MapLibrePicker from '../MapLibrePicker.jsx';

export default function OrderSummary({ 
  service, 
  shop, 
  auth,
  styleTag, 
  materialSource, 
  measurementPreference, 
  measurementDate, 
  materialDropoffDate,
  notes, 
  selectedAttributes, 
  designImagePreview, 
  totalPrice, 
  onSubmit,
  loading,
  profileComplete,
  onBack
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');

  // No attributes display needed in summary - handled by totalPrice

  // Local state for inline edits
  const [localPhone, setLocalPhone] = useState(auth.user.profile?.phone || '');
  const [showMapModal, setShowMapModal] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  
  // Profile completeness check
  const isProfileComplete = auth.user.profile?.phone && 
                           auth.user.profile?.street && 
                           auth.user.profile?.barangay && 
                           auth.user.profile?.latitude;
  
  // Map picker local state
  const [tempProfile, setTempProfile] = useState({
    latitude: auth.user.profile?.latitude || '',
    longitude: auth.user.profile?.longitude || '',
    address: auth.user.profile?.address || '',
    barangay: auth.user.profile?.barangay || '',
    street: auth.user.profile?.street || '',
    purok: auth.user.profile?.purok || '',
  });
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const handleSetData = (field, value) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveLocation = () => {
    if (!tempProfile.latitude || !tempProfile.longitude) return;
    setIsSavingLocation(true);
    
    router.patch('/profile', { 
      ...auth.user, 
      latitude: tempProfile.latitude,
      longitude: tempProfile.longitude,
      address: tempProfile.address || '',
      barangay: tempProfile.barangay || '',
      street: tempProfile.street || '',
      purok: tempProfile.purok || '',
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setIsSavingLocation(false);
        setShowMapModal(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsSavingLocation(false);
      }
    });
  };

  // Strictly bind missing status to the authentic user profile, not the typing state!
  const isPhoneMissing = !auth.user.profile?.phone;
  const isMapMissing = !auth.user.profile?.latitude;

  const handleSavePhone = () => {
    if (localPhone.trim().length < 10) return;
    setIsSavingPhone(true);
    
    router.patch('/profile', { 
      ...auth.user, 
      phone: localPhone.trim() 
    }, {
      preserveState: true, // CRITICAL: Tells Inertia not to wipe the modal state
      preserveScroll: true,
      onSuccess: () => setIsSavingPhone(false),
      onError: (errors) => {
        console.error(errors);
        setIsSavingPhone(false);
      }
    });
  };

  const summaryItems = [
    { label: 'Notes', value: notes },
    { label: 'Service', value: service.service_name + ' - ' + (service.price ? `₱${service.price.toLocaleString()}` : 'Price TBD') },
    { label: 'Material', value: materialSource?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
    ...(materialSource === 'dropoff' ? [{ label: 'Drop-off Date', value: materialDropoffDate ? new Date(materialDropoffDate).toLocaleDateString() : 'TBD' }] : []),
    { label: 'Fit Method', value: measurementPreference === 'self_measured' ? 'I will provide measurements' : 'In-Shop Fitting' },
    ...(measurementPreference === 'workshop_fitting' ? [{ label: 'Fitting Date', value: measurementDate ? new Date(measurementDate).toLocaleDateString() : (materialDropoffDate ? new Date(materialDropoffDate).toLocaleDateString() : 'TBD') }] : []),
  ];

  return (
    <div className="p-6 relative">
      <h3 className="text-lg font-semibold mb-6 text-center">Order Summary</h3>

      <div className="space-y-6 mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-stone-50 p-6 rounded-2xl border border-stone-200">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-amber-700">{service.service_name.split(' ')[0]?.[0] || 'J'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-black text-stone-900 mb-1 truncate">{service.service_name}</h4>
              <p className="text-stone-600 mb-2">{service.service_category?.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-sm text-stone-500 block mb-1">{item.label}</span>
              <span className="font-semibold text-stone-900 block truncate">{item.value || 'Not specified'}</span>
            </div>
          ))}
        </div>

        {/* Requested Attributes & Items */}
        {selectedAttributes.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-3">Requested Add-ons</span>
            <div className="flex flex-col gap-2">
              {selectedAttributes.map((attrId) => {
                const attr = shop?.attributes?.find(a => a.id === attrId);
                if (!attr) return null;
                const category = attr.attribute_category?.name || 'Add-on';
                return (
                  <div key={attrId} className="flex justify-between items-center p-3 bg-white border border-stone-200 rounded-xl shadow-sm">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block mb-0.5">{category}</span>
                      <span className="text-sm font-bold text-stone-800">{attr.name}</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600">+₱{attr.pivot?.price?.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl mb-8">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-black text-amber-800">Total</span>
          <span className="text-4xl font-black text-amber-600 tracking-tight">₱{totalPrice?.toLocaleString() || '0.00'}</span>
        </div>
      </div>

      {/* Profile Complete Summary or Checklist */}
      {!isProfileComplete ? (
        <>
          {/* INLINE CHECKLIST - NO REDIRECTS */}
          <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl mb-8 shadow-lg">
            <h4 className="text-lg font-bold text-amber-900 mb-4">Pre-Order Checklist</h4>
            <div className="space-y-3">
              
              {/* Phone Checklist Item */}
              <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 ${isPhoneMissing ? 'border-amber-400' : 'border-emerald-400'}`}>
                <span className="text-xl">{isPhoneMissing ? '❌' : '✅'}</span>
                <span className="text-sm font-medium text-stone-800">{isPhoneMissing ? 'Missing Contact Number' : 'Phone Verified'}</span>
                
                {isPhoneMissing && (
                  <div className="ml-auto flex items-center gap-2">
                    <input 
                      type="tel" 
                      value={localPhone} 
                      onChange={(e) => setLocalPhone(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      className="px-3 py-2 border border-amber-300 rounded-lg text-sm w-32 focus:ring-2 focus:ring-amber-500"
                    />
                    <button 
                      type="button" 
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isSavingPhone ? '...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Map Checklist Item */}
              <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 ${isMapMissing ? 'border-amber-400' : 'border-emerald-400'}`}>
                <span className="text-xl">{isMapMissing ? '❌' : '✅'}</span>
                <span className="text-sm font-medium text-stone-800">{isMapMissing ? 'Home Location not pinned' : 'Location Verified'}</span>
                
                {isMapMissing && (
                  <button 
                    type="button" 
                    onClick={() => setShowMapModal(true)} 
                    className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700"
                  >
                    Pin Map
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl mb-8 shadow-lg">
          <h4 className="text-lg font-bold text-emerald-900 mb-4">✅ Profile Complete</h4>
          <div className="text-sm font-medium text-emerald-800">
            Phone: {auth.user.profile.phone} | 
            Address: {auth.user.profile.street}, {auth.user.profile.barangay}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50">← Back</button>
        <button 
          type="button"
          onClick={onSubmit} 
          disabled={!isProfileComplete || loading} 
          className="flex-1 rounded-lg bg-emerald-600 px-8 py-4 font-bold text-xl text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Creating Job Card...' : '✅ Confirm & Submit Order'}
        </button>
      </div>

      {/* User Location Picker Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900">📍 Pin Your Home Location</h3>
                <button 
                  onClick={() => setShowMapModal(false)} 
                  className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <MapLibrePicker data={tempProfile} setData={handleSetData} />
            </div>
            <div className="p-6 border-t border-stone-200 bg-stone-50 flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setShowMapModal(false)} 
                className="px-6 py-3 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveLocation} 
                disabled={isSavingLocation || !tempProfile.latitude || !tempProfile.longitude}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingLocation ? 'Saving Location...' : '💾 Save Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
