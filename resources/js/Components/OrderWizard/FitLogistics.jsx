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
    if (isRepair) return true;
    if (measurementPreference === 'self_measured') return true;
    if (measurementPreference === 'workshop_fitting' && measurementDate) return true;
    return false;
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Fit Logistics</h3>
      {isRepair ? (
        <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-400 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">✂️</span>
          </div>
          <h4 className="text-2xl font-bold text-emerald-800 mb-4">No Measurements Required</h4>
          <p className="text-lg text-emerald-700">Repair services don't require body measurements.</p>
        </div>
      ) : (
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
            <motion.div whileHover={{ scale: 1.02 }} className={`h-56 border-2 rounded-2xl p-6 text-center transition-all ${measurementPreference === 'workshop_fitting' ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : 'border-stone-300 hover:border-blue-400'}`}>
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">📍</span>
              </div>
              <h4 className="text-xl font-bold text-stone-900 mb-2">Workshop Fitting</h4>
              
              {/* Checkbox only appears if they have a dropoff date */}
              {hasDropoffDate && measurementPreference === 'workshop_fitting' && (
                <div className="mt-3 p-3 bg-white/70 rounded-xl text-left border border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDropoffForFitting}
                      onChange={(e) => setUseDropoffForFitting(e.target.checked)}
                      className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-900">Same as drop-off ({new Date(materialDropoffDate).toLocaleDateString()})</span>
                  </label>
                </div>
              )}
            </motion.div>
          </label>
        </div>
      )}

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

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50">← Back</button>
        <button type="button" onClick={onNext} disabled={!effectiveCanNext()} className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Review Order →</button>
      </div>
    </div>
  );
}
