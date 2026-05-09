import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import axios from 'axios';
import { router } from '@inertiajs/react';
import MapLibrePicker from '../MapLibrePicker.jsx';
import BarangaySelect from '@/Components/BarangaySelect';
import { AlertCircle, Calendar, CheckCircle2, Home, MapPin, Ruler, Store, XCircle } from 'lucide-react';

export default function FitLogistics({
  service,
  shop,
  materialSource,
  measurementPreference,
  setMeasurementPreference,
  materialDropoffDate,
  materialDropoffTime,
  setMaterialDropoffDate,
  setMaterialDropoffTime,
  measurementDate,
  setMeasurementDate,
  measurementTime,
  setMeasurementTime,
  auth,
  onNext,
  onBack,
}) {
  if (!service) return null;

  const categorySlug = service.service_category?.slug || '';
  const isRepair = categorySlug.includes('repairs') || categorySlug.includes('alterations');
  const hasDropoffDate = Boolean(materialDropoffDate);
  const requiresAppointment = Boolean(service?.appointment_required);

  const [useDropoffForFitting, setUseDropoffForFitting] = useState(hasDropoffDate);
  const [availableDates, setAvailableDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localPhone, setLocalPhone] = useState(auth?.user?.profile?.phone || '');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    latitude: auth?.user?.profile?.latitude || '',
    longitude: auth?.user?.profile?.longitude || '',
    address: auth?.user?.profile?.address || '',
    barangay: auth?.user?.profile?.barangay || '',
    street: auth?.user?.profile?.street || '',
    location_details: auth?.user?.profile?.location_details || '',
    purok: auth?.user?.profile?.purok || '',
  });
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const isPhoneMissing = !auth?.user?.profile?.phone;
  const isMapMissing = !auth?.user?.profile?.latitude;
  const isProfileComplete = Boolean(
    auth?.user?.profile?.phone
    && auth?.user?.profile?.street
    && auth?.user?.profile?.barangay
    && auth?.user?.profile?.latitude
  );

  const fetchAvailability = async (month, year) => {
    if (!shop?.id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`/api/shops/${shop.id}/availability`, {
        params: { month, year },
      });
      setAvailableDates(response.data || {});
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableDates({});
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () => debounce((month, year) => fetchAvailability(month, year), 300),
    [shop?.id]
  );

  useEffect(() => {
    const now = new Date();
    fetchAvailability(now.getMonth() + 1, now.getFullYear());
  }, [shop?.id]);

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

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
  }, [measurementDate, measurementTime, selectedDate, setMeasurementDate]);

  useEffect(() => {
    if (requiresAppointment && measurementPreference === 'self_measure') {
      setMeasurementPreference('in_shop');
    }

    if (!measurementPreference) {
      setMeasurementPreference(requiresAppointment ? 'in_shop' : 'self_measure');
    }
  }, [measurementPreference, requiresAppointment, setMeasurementPreference]);

  // 1. Reset checkbox only if switching away from in-shop/home-visit
  useEffect(() => {
    if (!['in_shop', 'home_visit'].includes(measurementPreference)) {
      setUseDropoffForFitting(false);
    }
  }, [measurementPreference]);

  // 2. Only sync the dates if the user actually has the checkbox checked
  useEffect(() => {
    if (useDropoffForFitting && hasDropoffDate) {
      if (measurementDate !== materialDropoffDate) {
        setMeasurementDate(materialDropoffDate);
      }
      if (measurementTime !== materialDropoffTime) {
        setMeasurementTime(materialDropoffTime || '');
      }
    }
  }, [useDropoffForFitting, hasDropoffDate, materialDropoffDate, materialDropoffTime, measurementDate, measurementTime, setMeasurementDate, setMeasurementTime]);


  useEffect(() => {
    setLocalPhone(auth?.user?.profile?.phone || '');
    setTempProfile({
      latitude: auth?.user?.profile?.latitude || '',
      longitude: auth?.user?.profile?.longitude || '',
      address: auth?.user?.profile?.address || '',
      barangay: auth?.user?.profile?.barangay || '',
      street: auth?.user?.profile?.street || '',
      location_details: auth?.user?.profile?.location_details || '',
      purok: auth?.user?.profile?.purok || '',
    });
  }, [auth?.user?.profile]);

  const handleSetData = (field, value) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLocation = async () => {
    if (!tempProfile.latitude || !tempProfile.longitude) return;
    setIsSavingLocation(true);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      // Save in the background without triggering a page navigation
      await axios.patch('/api/checkout/save-profile', {
        latitude: tempProfile.latitude,
        longitude: tempProfile.longitude,
        address: tempProfile.address || '',
        barangay: tempProfile.barangay || '',
        street: tempProfile.street || '',
        location_details: tempProfile.location_details || '',
        purok: tempProfile.purok || '',
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        withCredentials: true,
      });

      // Quietly refresh the auth props and close the modal
      router.reload({ only: ['auth'] });
      setLocationSuccessMsg(true);
      setTimeout(() => setLocationSuccessMsg(false), 4000);
      setShowMapModal(false);
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleSavePhone = async () => {
    const digitsOnly = localPhone.replace(/\D/g, '');
    if (digitsOnly.length !== 11) return;
    setIsSavingPhone(true);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      // Save in the background without triggering a page navigation
      await axios.patch('/api/checkout/save-profile', { phone: digitsOnly }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        withCredentials: true,
      });
      // Quietly refresh the auth props on the current page so the UI updates
      router.reload({ only: ['auth'] });
      setPhoneSuccessMsg(true);
      setTimeout(() => setPhoneSuccessMsg(false), 3000);
    } catch (error) {
      console.error('Failed to save phone:', error);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const getDaySlots = (dateKey) => {
    const dayData = availableDates[dateKey];
    if (!dayData) return [];

    if (typeof dayData === 'object' && !Array.isArray(dayData) && !dayData.slots) {
      return [];
    }

    if (Array.isArray(dayData) && dayData.length > 0 && typeof dayData[0] === 'object') {
      return dayData;
    }

    if (Array.isArray(dayData)) {
      return dayData.map((time) => ({
        time,
        booked_count: 0,
        slots_left: null,
        user_booking_count: 0,
        is_available: true,
      }));
    }

    if (dayData.slots && Array.isArray(dayData.slots)) {
      return dayData.slots;
    }

    return [];
  };

  const handleSelfMeasured = () => {
    if (requiresAppointment) return;
    setMeasurementPreference('self_measure');
    setMeasurementDate('');
    setMeasurementTime('');
    setSelectedDate(null);
    setSelectedTime(null);
    setUseDropoffForFitting(false);
  };

  const handleInShopFitting = () => {
    setMeasurementPreference('in_shop');
    if (hasDropoffDate) {
      setUseDropoffForFitting(true);
      setMeasurementDate(materialDropoffDate);
      setMeasurementTime(materialDropoffTime || '');
      setSelectedDate(materialDropoffDate ? new Date(`${materialDropoffDate}T00:00:00`) : null);
      setSelectedTime(materialDropoffTime || null);
      return;
    }

    setUseDropoffForFitting(false);
    setMeasurementDate('');
    setMeasurementTime('');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleHomeVisit = () => {
    setMeasurementPreference('home_visit');
    if (hasDropoffDate) {
      setUseDropoffForFitting(true);
      setMeasurementDate(materialDropoffDate);
      setMeasurementTime(materialDropoffTime || '');
      setSelectedDate(materialDropoffDate ? new Date(`${materialDropoffDate}T00:00:00`) : null);
      setSelectedTime(materialDropoffTime || null);
      return;
    }

    setUseDropoffForFitting(false);
    setMeasurementDate('');
    setMeasurementTime('');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNoMeasurement = () => {
    setMeasurementPreference('none');
    setUseDropoffForFitting(false);
    setMeasurementDate('');
    setMeasurementTime('');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const isScheduledPreference = ['in_shop', 'home_visit', 'workshop_fitting'].includes(measurementPreference);

  const effectiveCanNext = () => {
    if (measurementPreference === 'none') return true;
    if (measurementPreference === 'self_measured') return true;
    if (measurementPreference === 'self_measure' && !requiresAppointment) return true;
    if (measurementPreference === 'in_shop') {
      if (hasDropoffDate && useDropoffForFitting && materialDropoffDate && materialDropoffTime) return true;
      return Boolean(selectedDate && selectedTime);
    }
    if (measurementPreference === 'home_visit') {
      return Boolean(selectedDate && selectedTime);
    }
    if (isScheduledPreference) {
      return Boolean(selectedDate && selectedTime);
    }
    return false;
  };

  return (
    <div className="p-6">
      <h3 className="mb-6 text-lg font-semibold">Fit & Measurements</h3>

      <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl mb-8 shadow-lg">
        <h4 className="text-lg font-bold text-amber-900 mb-4">Pre-Order Checklist</h4>
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 ${(isPhoneMissing && !phoneSuccessMsg) ? 'border-amber-400' : 'border-emerald-400'}`}>
            {(isPhoneMissing && !phoneSuccessMsg) ? (
              <XCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            <span className="text-sm font-medium text-stone-800">
              {phoneSuccessMsg ? 'Phone Successfully Saved!' : isPhoneMissing ? 'Missing Contact Number' : 'Phone Verified'}
            </span>
            {(isPhoneMissing && !phoneSuccessMsg) && (
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => {
                    // Only allow numbers and limit to 11 characters
                    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setLocalPhone(numericValue);
                  }}
                  placeholder="09xxxxxxxxx"
                  maxLength={11}
                  className="w-32 rounded-lg border border-amber-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={isSavingPhone || localPhone.length !== 11}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSavingPhone ? '...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border-l-4 ${(isMapMissing && !locationSuccessMsg) ? 'border-amber-400' : 'border-emerald-400'}`}>
            {(isMapMissing && !locationSuccessMsg) ? (
              <MapPin className="h-5 w-5 text-amber-500" />
            ) : (
              <MapPin className="h-5 w-5 text-emerald-600" />
            )}
            <span className="text-sm font-medium text-stone-800">
              {locationSuccessMsg ? 'Location Successfully Saved!' : isMapMissing ? 'Home Location not pinned' : 'Location Verified'}
            </span>
            {(isMapMissing && !locationSuccessMsg) && (
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="ml-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
              >
                Pin Map
              </button>
            )}
          </div>
        </div>
      </div>

      {isProfileComplete ? (
        <>
          <div className="mb-8">
            <label className="mb-4 block text-sm font-semibold text-stone-800">
              Choose how the fitting will happen
            </label>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.button
                type="button"
                whileHover={requiresAppointment ? undefined : { scale: 1.01 }}
                onClick={handleSelfMeasured}
                disabled={requiresAppointment}
                className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                  requiresAppointment
                    ? 'cursor-not-allowed border-stone-200 bg-stone-100 opacity-60'
                    : measurementPreference === 'self_measure'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-stone-200 bg-white hover:border-emerald-300'
                }`}
              >
                {requiresAppointment && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                    <AlertCircle className="h-3 w-3" />
                    Disabled
                  </span>
                )}
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Ruler className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-lg font-black text-slate-800">Self-Measurement</h4>
                <p className="text-sm font-medium text-slate-600">Submit your own measurements online.</p>
                {requiresAppointment && (
                  <p className="mt-3 text-xs font-bold text-rose-600">
                    This service requires an appointment, so self-measurement is unavailable.
                  </p>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                onClick={handleInShopFitting}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  measurementPreference === 'in_shop'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-stone-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Store className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-lg font-black text-slate-800">Visit Shop</h4>
                <p className="text-sm font-medium text-slate-600">Go to the tailor's shop for a professional fitting and material drop-off.</p>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                onClick={handleHomeVisit}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  measurementPreference === 'home_visit'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-stone-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Home className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-lg font-black text-slate-800">Home Visit</h4>
                <p className="text-sm font-medium text-slate-600">A tailor visits your location for measurements and pickup.</p>
              </motion.button>

              {/* Option 4: No Measurement Needed */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                onClick={handleNoMeasurement}
                className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                  measurementPreference === 'none'
                    ? 'border-stone-500 bg-stone-100 shadow-md'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200 text-stone-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="mb-1 text-lg font-black text-slate-800">Skip Measurements</h4>
                <p className="text-sm font-medium text-slate-600">My order does not require body measurements.</p>
              </motion.button>
            </div>

            {requiresAppointment && measurementPreference === 'self_measure' && (
              <div className="mt-4 ml-2 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>This service requires a fitting appointment, so self-measurement is disabled.</p>
              </div>
            )}
          </div>

          {materialSource === 'customer' && ['in_shop', 'home_visit'].includes(measurementPreference) && hasDropoffDate && (
            <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={useDropoffForFitting}
                  onChange={(e) => setUseDropoffForFitting(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-blue-900">
                  Use the same schedule as material drop-off ({new Date(materialDropoffDate).toLocaleDateString()})
                </span>
              </label>
            </div>
          )}

          {(
            measurementPreference === 'in_shop'
            || measurementPreference === 'home_visit'
            || measurementPreference === 'workshop_fitting'
          ) && (!hasDropoffDate || !useDropoffForFitting) && shop?.id && (
            <div className="mb-8 rounded-3xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 animate-fade-in-up">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <label className="block text-sm font-black text-blue-900">
                    {measurementPreference === 'home_visit'
                      ? 'Select Date & Time for Home Visit (Fitting & Material Pickup)'
                      : 'Pick fitting date & time:'}
                  </label>
                  <p className="mt-1 text-xs font-medium text-blue-700">
                    {measurementPreference === 'home_visit'
                      ? 'The tailor will travel to your location for measurements and material pickup.'
                      : 'Choose a shop appointment that works for you.'}
                  </p>
                </div>
              </div>

              <div className="relative mb-6">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-blue-600" />
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
                    debouncedFetch(date.getMonth() + 1, date.getFullYear());
                  }}
                  minDate={new Date()}
                  inline
                  className="w-full"
                />
              </div>

              {selectedDate && (
                <div className="animate-fade-in-up">
                  <label className="mb-3 block text-sm font-bold text-blue-900">Available times:</label>
                  {(() => {
                    const dateKey = format(selectedDate, 'yyyy-MM-dd');
                    const slots = getDaySlots(dateKey);

                    if (slots.length === 0) {
                      return <p className="text-sm italic text-blue-700">No available slots for this date.</p>;
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
                              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all ${
                                isDisabled
                                  ? 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-60'
                                  : selectedTime === time
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                              }`}
                            >
                              <span className="block">{time}</span>
                              {!isAvailable ? (
                                <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                                  Fully Booked
                                </span>
                              ) : userBookingCount >= maxUserBookings ? (
                                <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                                  Your Limit Reached
                                </span>
                              ) : userBookingCount > 0 ? (
                                <span className="mt-1 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                                  You booked {userBookingCount} {userBookingCount > 1 ? 'times' : 'time'} • {slotsLeft} slots left
                                </span>
                              ) : (
                                <span className={`mt-1 block text-[10px] ${selectedTime === time ? 'text-emerald-100' : 'text-stone-500'}`}>
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

          <div className="flex gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50"
            >
              Back
            </button>
            <div className="flex-1">
              <button
                type="button"
                onClick={onNext}
                disabled={!effectiveCanNext()}
                className="w-full rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Review Order
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center text-stone-500 font-medium border-2 border-dashed border-stone-200 rounded-2xl">
          Please complete your profile checklist above to unlock checkout options.
        </div>
      )}

      {showMapModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowMapModal(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-stone-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900">Pin Your Home Location</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Barangay *</label>
                  <BarangaySelect
                    id="barangay"
                    value={tempProfile.barangay}
                    onChange={(val) => handleSetData('barangay', val)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Street / House No. *</label>
                  <input
                    type="text"
                    value={tempProfile.street}
                    onChange={(e) => handleSetData('street', e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="House / unit / street"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">Landmark / Location Details (Optional)</label>
                  <textarea
                    value={tempProfile.location_details || ''}
                    onChange={(e) => handleSetData('location_details', e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g., Near the blue gate, behind the bakery..."
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Pin Exact Location on Map *</label>
                <MapLibrePicker data={tempProfile} setData={handleSetData} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-stone-200 bg-stone-50 p-6">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="rounded-xl border border-stone-300 px-6 py-3 font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={isSavingLocation || !tempProfile.latitude || !tempProfile.longitude || !tempProfile.street || !tempProfile.barangay}
                className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingLocation ? 'Saving Location...' : 'Save Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
