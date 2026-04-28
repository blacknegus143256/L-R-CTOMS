import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import axios from 'axios';

export default function FitLogistics({ 
  service,
  shop,
  measurementPreference,
  setMeasurementPreference,
  materialDropoffDate,
  materialDropoffTime,
  measurementDate,
  setMeasurementDate,
  measurementTime,
  setMeasurementTime,
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

  // Availability API state
  const [availableDates, setAvailableDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch availability from API
  const fetchAvailability = async (month, year) => {
    if (!shop?.id) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/shops/${shop.id}/availability`, {
        params: { month, year }
      });
      setAvailableDates(response.data || {});
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableDates({});
    } finally {
      setIsLoading(false);
    }
  };

  // Stable debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce((m, y) => fetchAvailability(m, y), 300),
    []
  );

  // Fetch availability on mount for current month
  useEffect(() => {
    const now = new Date();
    fetchAvailability(now.getMonth() + 1, now.getFullYear());
  }, [shop?.id]);

  useEffect(() => {
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  useEffect(() => {
    const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    if (measurementDate && selectedDateKey !== measurementDate) {
      setSelectedDate(new Date(`${measurementDate}T00:00:00`));
    }

    if (!measurementDate && selectedDate) {
      setSelectedDate(null);
    }

    if (measurementTime) {
      setSelectedTime(measurementTime);
    } else {
      setSelectedTime(null);
    }
  }, [measurementDate, measurementTime, selectedDate]);

  const getDaySlots = (dateKey) => {
    const dayData = availableDates[dateKey];
    if (!dayData) return [];
    
    // Guard against empty or malformed objects
    if (typeof dayData === 'object' && !Array.isArray(dayData) && !dayData.slots) {
      return [];
    }
    // If the API returns a direct array of objects (New API format)
    if (Array.isArray(dayData) && dayData.length > 0 && typeof dayData[0] === 'object') {
      return dayData;
    }
    // If the API returns an array of strings (Legacy API format fallback)
    if (Array.isArray(dayData)) {
      return dayData.map((time) => ({ time, booked_count: 0, slots_left: null, user_booking_count: 0, is_available: true }));
    }
    // If the API returns { slots: [...] }
    if (dayData.slots && Array.isArray(dayData.slots)) {
      return dayData.slots;
    }
    return [];
  };

  // Sync dates when checkbox is toggled
  useEffect(() => {
    if (measurementPreference === 'workshop_fitting') {
      if (useDropoffForFitting && hasDropoffDate) {
        if (measurementDate !== materialDropoffDate) {
          setMeasurementDate(materialDropoffDate);
        }
        if ((measurementTime || '') !== (materialDropoffTime || '')) {
          setMeasurementTime(materialDropoffTime || '');
        }
      }
    }
  }, [useDropoffForFitting, measurementPreference, hasDropoffDate, materialDropoffDate, materialDropoffTime, measurementDate, setMeasurementDate, setMeasurementTime]);

  // NEW EFFECT: If it's a repair, aggressively default the gatekeeper to 'No'
  useEffect(() => {
    if (isRepair && needsMeasurements === null) {
        
        setNeedsMeasurements(false);
        setMeasurementPreference('none'); // 👈 Changed from 'profile'
    }
  }, [isRepair, needsMeasurements]);

  const handleSelfMeasured = () => {
    setMeasurementPreference('self_measured');
    setMeasurementDate(''); // Erase date
    setMeasurementTime('');
  };

  const handleWorkshopFitting = () => {
    setMeasurementPreference('workshop_fitting');
    if (hasDropoffDate) setUseDropoffForFitting(true);
  };
  const handleNoneMeasured = () => {
    setMeasurementPreference('none');
    setMeasurementDate(''); // Erase date
    setMeasurementTime('');
  };

  // Determine if they can proceed
  const effectiveCanNext = () => {
    if (needsMeasurements !== null) {
      if (needsMeasurements === false && measurementPreference === 'none') return true;

      // If they said they need measurements, check if they've selected an option
      if (measurementPreference === 'self_measured' || measurementPreference === 'profile') return true;
      if (measurementPreference === 'workshop_fitting') {
        // For workshop fitting, they must select a time slot
        if (hasDropoffDate && useDropoffForFitting && materialDropoffTime) return true;
        if (selectedDate && selectedTime) return true;
      }
      return false;
    }
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
                setMeasurementPreference('none'); // 👈 Changed from 'profile'
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

            {/* DatePicker & Time Slots */}
            {measurementPreference === 'workshop_fitting' && (!hasDropoffDate || !useDropoffForFitting) && shop?.id && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 rounded-b-3xl mb-8 animate-fade-in-up">
                <label className="block text-sm font-bold text-blue-900 mb-4">Pick fitting date & time:</label>
                
                {/* Calendar with date picker */}
                <div className="mb-6 relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setMeasurementTime('');

                      if (date) {
                        setMeasurementDate(format(date, 'yyyy-MM-dd'));
                      } else {
                        setMeasurementDate('');
                      }
                    }}
                    filterDate={(date) => {
                      const key = format(date, 'yyyy-MM-dd');
                      return getDaySlots(key).some((slot) => slot.is_available);
                    }}
                    onMonthChange={(date) => {
                      const month = date.getMonth() + 1;
                      const year = date.getFullYear();
                      debouncedFetch(month, year);
                    }}
                    minDate={new Date()}
                    inline
                    className="w-full"
                  />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-bold text-blue-900 mb-3">Available times:</label>
                    {(() => {
                      const dateKey = format(selectedDate, 'yyyy-MM-dd');
                      const slots = getDaySlots(dateKey);
                      
                      if (slots.length === 0) {
                        return <p className="text-blue-700 text-sm italic">No available slots for this date.</p>;
                      }

                      return (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {slots.map((slot) => {
                            const time = slot.time;
                            const isAvailable = slot.is_available;
                            const userBookingCount = Number(slot.user_booking_count ?? 0);
                            const maxUserBookings = Number(slot.max_user_bookings ?? 3);
                            const slotsLeft = Number(slot.slots_left ?? 0);
                            const isDisabled = !isAvailable || userBookingCount >= maxUserBookings;

                            return (
                            <button
                              key={time}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                setSelectedTime(time);
                                setMeasurementDate(dateKey);
                                setMeasurementTime(time);
                              }}
                              className={`py-2 px-3 rounded-lg border font-medium text-sm transition-all text-left ${
                                isDisabled
                                  ? 'border-stone-200 bg-stone-100 cursor-not-allowed opacity-60 text-stone-400'
                                  : selectedTime === time
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                              }`}
                            >
                              <span className="block">{time}</span>
                              {!isAvailable ? (
                                <span className="inline-flex mt-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                                  Fully Booked
                                </span>
                              ) : userBookingCount >= maxUserBookings ? (
                                <span className="inline-flex mt-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                                  Your Limit Reached
                                </span>
                              ) : userBookingCount > 0 ? (
                                <span className="inline-flex mt-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                                  You booked {userBookingCount} {userBookingCount > 1 ? 'times' : 'time'} • {slotsLeft} slots left
                                </span>
                              ) : (
                                <span className={`block text-[10px] mt-1 ${selectedTime === time ? 'text-emerald-100' : 'text-stone-500'}`}>
                                  {slotsLeft} slots left
                                </span>
                              )}
                            </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
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
        <div className="flex-1">
          <button type="button" onClick={onNext} disabled={!effectiveCanNext()} className="w-full rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Review Order →</button>
          {needsMeasurements === false && measurementPreference === 'none' && (
            <p className="mt-2 text-xs text-emerald-700 font-semibold">No measurements selected. You can proceed with reference garment flow.</p>
          )}
        </div>
      </div>
    </div>
  );
}
