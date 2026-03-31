import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MeasurementForm from '../MeasurementForm';

export default function FitLogistics({ 
  service,
  measurementType,
  setMeasurementType,
  profileComplete,
  profileMeasurements,
  onUpdateMeasurements,
  onNext,
  canNext,
  onBack
}) {
  if (!service) return null;
  const REQUIRED_MEASUREMENTS = ['neck', 'chest','shoulder_width', 'waist', 'hips'];

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const missingMeasurements = REQUIRED_MEASUREMENTS.filter(
    (key) => !profileMeasurements?.[key] || parseFloat(profileMeasurements[key]) <= 0
    );
    const isStillMissing = missingMeasurements.some(
    (key) => !profileMeasurements?.[key] || parseFloat(profileMeasurements[key]) <= 0
  );
  // Enhanced empty check: sum values == 0
  const profileSum = Object.values(profileMeasurements || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const isProfileEmpty = missingMeasurements.length === REQUIRED_MEASUREMENTS.length;
  const isProfilePartial = missingMeasurements.length > 0 && !isProfileEmpty;
  const isProfileSelected = measurementType === 'profile';
  const profileStats = Object.values(profileMeasurements || {}).filter(v => parseFloat(v) > 0).length || 0;
  const completeness = profileComplete && profileStats > 0 && !isProfileEmpty ? 'complete' : 'partial';
  
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);

  
  // Guard modal handlers
  const handleProceedWithMeasurements = () => {
    setIsGuardModalOpen(false);
  };

  const handleSwitchToSchedule = () => {
    setMeasurementType('schedule');
    setIsGuardModalOpen(false);
  };

  // Override onNext for guard logic
  const handleGuardedNext = () => {
    if (!isRepair && isProfileSelected && isProfileEmpty) {
      setIsGuardModalOpen(true);
      return;
    }
    onNext();
  };
  const effectiveCanNext =
  isRepair ||
  measurementType === 'schedule' ||
  (measurementType === 'profile' && !isProfileEmpty);
  return (
    <>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6">Measurements</h3>

        {isRepair ? (
          <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-400 rounded-3xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-emerald-800 mb-4">No Measurements Needed</h4>
            <p className="text-lg text-emerald-700 mb-6 leading-relaxed">Repair services don't require body measurements. We'll work with what you bring!</p>
            <div className="bg-emerald-200/50 border border-emerald-300 rounded-2xl p-4">
              <p className="text-emerald-800 font-semibold">Ready to Review?</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Fit */}
            <label className="group cursor-pointer">
              <input
                type="radio"
                name="measurement_type"
                value="profile"
                checked={measurementType === 'profile'}
                onChange={(e) => setMeasurementType(e.target.value)}
                className="sr-only"
                disabled={!profileComplete}
              />
              <div className={`h-44 border-2 rounded-2xl p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                measurementType === 'profile' 
                  ? 'border-emerald-400 bg-emerald-50 shadow-lg' 
                  : 'border-stone-300 hover:border-emerald-400'
              } ${!profileComplete ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-stone-800 mb-2">Use Profile</h4>
                {isProfileEmpty && isProfileSelected && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ You need to enter measurements before proceeding
                </p>
              )}
                {isProfileEmpty && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl mb-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-5 h-5 mt-0.5 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-semibold text-amber-900 text-sm">Your fit profile is empty</h5>
                        <p className="text-stone-600 mb-8 text-lg leading-relaxed text-center">
                        {isProfileEmpty
                          ? "You haven’t added any measurements yet."
                          : "You're almost there — just a few more details needed."}
                      </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowQuickFill(true)}
                      className="w-full bg-amber-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition-all shadow-sm"
                    >
                      Quick-Fill Now
                    </button>
                  </div>
                )}
                <div className={`text-sm px-3 py-1 rounded-full mx-auto w-fit font-medium mb-2 ${
                  completeness === 'complete' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {completeness === 'complete' ? '✅ Complete' : '⚠️ Partial'}
                </div>
                <p className="text-sm text-stone-600">{profileStats} measurements recorded</p>
                {completeness !== 'complete' && !isProfileEmpty && profileComplete && (
                  <button 
                    onClick={() => setShowQuickFill(true)}
                    className="mt-2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Quick-Fill
                  </button>
                )}
              </div>
              {!profileComplete && (
                <p className="mt-2 text-xs text-amber-700 text-center">Complete your profile for instant fit</p>
              )}
            </label>

            {/* Schedule New */}
            <label className="group cursor-pointer">
              <input
                type="radio"
                name="measurement_type"
                value="schedule"
                checked={measurementType === 'schedule'}
                onChange={(e) => setMeasurementType(e.target.value)}
                className="sr-only"
              />
              <div className={`h-44 border-2 rounded-2xl p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                measurementType === 'schedule' ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-stone-300 hover:border-blue-400'
              }`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-stone-800 mb-2">Schedule Fitting</h4>
                <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full mx-auto w-fit font-medium mb-2">
                  📅 New Appointment
                </div>
                <p className="text-sm text-stone-600">Book session with tailor</p>
              </div>
            </label>
          </div>
        )}

        <div className="mt-8 flex gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleGuardedNext}
            disabled={!effectiveCanNext}
            className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-bold text-white hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Order →
          </button>
        </div>

        {/* Quick Fill Modal (existing) */}
        {showQuickFill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl border border-stone-200"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-stone-900">Quick Measurements</h3>
                <button
                  onClick={() => setShowQuickFill(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-stone-600 mb-6 text-sm">Fill your measurements for faster bespoke checkout.</p>
              <MeasurementForm 
                data={profileMeasurements} 
                setData={onUpdateMeasurements} 
                errors={{}}

                measurementsToShow={['neck', 'chest','shoulder_width', 'waist', 'hips']}
              />
              <div className="flex gap-3 mt-6 pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    setMeasurementType('schedule');
                    setShowQuickFill(false);
                  }}
                  className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Measure In Person
                </button>
                <button
                  onClick={() => setShowQuickFill(false)}
                  className="flex-1 rounded-lg bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  Measurements Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Measurement Guard Modal */}
        {isGuardModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-violet-200 shadow-violet-200/50">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">Perfect Fit Required</h3>
                    <p className="text-stone-700 font-semibold">Enter measurements for custom tailoring</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGuardModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-3xl font-bold p-2 -m-2 rounded-xl hover:bg-stone-100 transition-all"
                >
                  ×
                </button>
              </div>

              <p className="text-stone-600 mb-8 text-lg leading-relaxed max-w-lg mx-auto text-center">
                We need your body measurements to ensure a perfect fit. Choose your preferred method:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Path A: Quick-Fill */}
                <div className="group cursor-pointer p-6 border-2 border-violet-200 rounded-2xl hover:border-violet-400 hover:shadow-xl transition-all bg-gradient-to-br from-violet-50 to-purple-25">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-400 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-violet-800">📏 Quick Specs</h4>
                      <p className="text-violet-700 font-medium">Enter measurements now</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MeasurementForm 
                      data={profileMeasurements} 
                      setData={onUpdateMeasurements} 
                      errors={{}}
                      measurementsToShow={['neck', 'chest', 'waist', 'inseam']}
                      className="space-y-2"
                    />
                  </div>
                  <button
                    onClick={handleProceedWithMeasurements}
                    disabled={isStillMissing}
                    className="mt-6 w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Use These Measurements
                  </button>
                </div>

                {/* Path B: Schedule */}
                <div className="group cursor-pointer p-6 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 hover:shadow-xl transition-all bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-400 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-emerald-800">📅 Schedule Fitting</h4>
                      <p className="text-emerald-700 font-medium">In-person consultation</p>
                    </div>
                  </div>
                  <p className="text-stone-600 mb-6 leading-relaxed">Book a session with our tailor for precise measurements.</p>
                  <button
                    onClick={handleSwitchToSchedule}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Schedule Fitting Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

