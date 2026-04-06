import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function NewFitLogistics({ 
  service,
  measurementPreference,
  setMeasurementPreference,
  materialDropoffDate,
  measurementDate,
  setMeasurementDate,
  onNext,
  onBack
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const hasDropoffDate = !!materialDropoffDate;
  
  // Local state to track checkbox
  const [useDropoffForFitting, setUseDropoffForFitting] = useState(hasDropoffDate);
  const [needsMeasurements, setNeedsMeasurements] = useState(null); // true, false, or null

  // Sync dates when checkbox is toggled
  useEffect(() => {
    if (measurementPreference === 'workshop_fitting') {
      if (useDropoffForFitting && hasDropoffDate) {
        setMeasurementDate(materialDropoffDate);
      } else if (measurementDate === materialDropoffDate) {
        setMeasurementDate(''); // Clear it if they uncheck it
      }
    }
  }, [useDropoffForFitting, measurementPreference, hasDropoffDate]);

  // NEW EFFECT: If it's a repair, aggressively default the gatekeeper to 'No'
  useEffect(() => {
    if (isRepair && needsMeasurements === null) {
        setNeedsMeasurements(false);
        setMeasurementPreference('profile');
    }
  }, [isRepair, needsMeasurements]);

  const handleSelfMeasured = () => {
    setMeasurementPreference('self_measured');
    setMeasurementDate(''); // Erase date
  };

  const handleWorkshopFitting = () => {
    setMeasurementPreference('workshop_fitting');
    if (hasDropoffDate) setUseDropoffForFitting(true);
  };

  // Determine if they can proceed
  const effectiveCanNext = () => {
    if (needsMeasurements !== null) return true;
    if (measurementPreference === 'self_measured' || measurementPreference === 'profile') return true;
    if (measurementPreference === 'workshop_fitting' && measurementDate) return true;
    return false;
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Fit & Measurements</h3>

        {/* Gatekeeper Question */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-stone-800 mb-4">
            Does this project require specific body measurements?
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <button 
              type="button"
              onClick={() => {
                setNeedsMeasurements(true);
                setMeasurementPreference('self_measured'); // Reset to default
              }}
              className={`flex-1 py-4 px-6 text-left rounded-2xl border-2 transition-all ${needsMeasurements === true ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-stone-200 hover:border-indigo-300'}`}
            >
              <span className="block font-bold text-indigo-900 text-lg mb-1">Yes</span>
              <span className="block text-sm text-indigo-700">Custom tailored fit from scratch</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setNeedsMeasurements(false);
                // Secretly pass 'profile' to bypass Laravel strict validation without triggering an appointment
                setMeasurementPreference('profile'); 
              }}
              className={`flex-1 py-4 px-6 text-left rounded-2xl border-2 transition-all ${needsMeasurements === false ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-stone-200 hover:border-emerald-300'}`}
            >
              <span className="block font-bold text-emerald-900 text-lg mb-1">No</span>
              <span className="block text-sm text-emerald-700">Standard alteration / reference garment provided</span>
            </button>
          </div>
        </div>

        {/* ONLY show the original choices if they clicked YES */}
        {needsMeasurements === true && (
          <div className="animate-fade-in-up border-t border-stone-200 pt-8 mt-4">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Choice A: Self Measured */}
                <label className="group cursor-pointer">
                  <input
                    type="radio"
                    name="measurement_preference"
                    value="self_measured"
                    checked={measurementPreference === 'self_measured'}
                    onChange={handleSelfMeasured}
                    className="sr-only"
                  />
                  <motion.div whileHover={{ scale: 1.02 }} className={`h-56 border-2 rounded-2xl p-8 text-center transition-all ${measurementPreference === 'self_measured' ? 'border-emerald-400 bg-emerald-50 shadow-lg ring-2 ring-emerald-200' : 'border-stone-300 hover:border-emerald-400'}`}>
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl text-white">📏</span>
                    </div>
                    <h4 className="text-xl font-bold text-stone-900 mb-2">Self Measured</h4>
                    <p className="text-stone-600 text-sm">Workshop will send the exact list needed for your design.</p>
                  </motion.div>
                </label>

                {/* Choice B: Workshop Fitting */}
                <label className="group cursor-pointer">
                  <input
                    type="radio"
                    name="measurement_preference"
                    value="workshop_fitting"
                    checked={measurementPreference === 'workshop_fitting'}
                    onChange={handleWorkshopFitting}
                    className="sr-only"
                  />
                  <motion.div whileHover={{ scale: 1.02 }} className={`h-56 border-2 rounded-2xl p-6 text-center transition-all flex flex-col justify-center ${measurementPreference === 'workshop_fitting' ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : 'border-stone-300 hover:border-blue-400'}`}>
                    <div className="w-16 h-16 mx-auto mb-2 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-3xl text-white">📍</span>
                    </div>
                    <h4 className="text-xl font-bold text-stone-900 mb-1">Workshop Fitting</h4>
                    
                    {/* Checkbox only appears if they have a dropoff date */}
                    {hasDropoffDate && measurementPreference === 'workshop_fitting' && (
                      <div className="mt-2 p-2 bg-white/70 rounded-xl text-left border border-blue-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useDropoffForFitting}
                            onChange={(e) => setUseDropoffForFitting(e.target.checked)}
                            className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-blue-900">Same as drop-off ({new Date(materialDropoffDate).toLocaleDateString()})</span>
                        </label>
                      </div>
                    )}
                  </motion.div>
                </label>
              </div>

            {/* Manual Date Picker */}
            {measurementPreference === 'workshop_fitting' && (!hasDropoffDate || !useDropoffForFitting) && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 rounded-b-3xl mb-8 animate-fade-in-up">
                <label className="block text-sm font-bold text-blue-900 mb-2">Pick fitting date:</label>
                <input
                  type="date"
                  value={measurementDate ? measurementDate.split('T')[0] : ''}
                  onChange={(e) => setMeasurementDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full max-w-md px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
              </div>
            )}
          </div>
        )}

        
        {/* If NO, show a simple confirmation message */}
        {needsMeasurements === false && (
          <div className="animate-fade-in-up mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-400 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                 ✂️
             </div>
             <div>
                <p className="font-bold text-lg">No Measurements Required</p>
                <p className="text-sm mt-1 opacity-90">If you are providing a reference garment, please bring it during your material drop-off.</p>
             </div>
          </div>
        )}


      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50">← Back</button>
        <button type="button" onClick={onNext} disabled={!effectiveCanNext()} className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Review Order →</button>
      </div>
    </div>
  );
}
