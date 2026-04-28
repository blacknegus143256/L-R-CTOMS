import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import axios from 'axios';

export default function Logistics({ 
  service,
  shop,
  materialDropoffDate,
  setMaterialDropoffDate,
  materialDropoffTime,
  setMaterialDropoffTime,
  materialSource,
  onNext,
  onBack
}) {
  if (!service) return null;

  const isDroppingOff = materialSource === 'customer';

  const [availableDates, setAvailableDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvailability = async (month, year) => {
    if (!shop?.id || !isDroppingOff) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`/api/shops/${shop.id}/availability`, {
        params: { month, year },
      });
      setAvailableDates(response.data || {});
    } catch (error) {
      console.error('Failed to fetch material drop-off availability:', error);
      setAvailableDates({});
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () => debounce((m, y) => fetchAvailability(m, y), 300),
    [shop?.id, isDroppingOff]
  );

  useEffect(() => {
    if (!isDroppingOff) {
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableDates({});
      setIsLoading(false);
      return;
    }

    const now = new Date();
    fetchAvailability(now.getMonth() + 1, now.getFullYear());
  }, [shop?.id, isDroppingOff]);

  useEffect(() => {
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  useEffect(() => {
    const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    if (materialDropoffDate && selectedDateKey !== materialDropoffDate) {
      setSelectedDate(new Date(`${materialDropoffDate}T00:00:00`));
    }

    if (!materialDropoffDate && selectedDate) {
      setSelectedDate(null);
    }

    if (materialDropoffTime) {
      setSelectedTime(materialDropoffTime);
    } else {
      setSelectedTime(null);
    }
  }, [materialDropoffDate, materialDropoffTime, selectedDate]);

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

  const canProceed = !isDroppingOff || (selectedDate && selectedTime);

  const handleNextClick = () => {
    if (!canProceed) return;

    if (!isDroppingOff) {
      setMaterialDropoffDate('');
      setMaterialDropoffTime('');
      onNext({ date: '', time: '' });
      return;
    }

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setMaterialDropoffDate(dateKey);
    setMaterialDropoffTime(selectedTime);
    onNext({ date: dateKey, time: selectedTime });
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Drop-off Logistics</h3>

      {/* Cost-Saving Note */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-bold text-amber-800 mb-1">Cost-Saving Tip</h4>
            <p className="text-amber-700 leading-relaxed">Bringing your own fabric/items? Save on project cost. Our workshop will work with what you provide!</p>
          </div>
        </div>
      </div>

      {materialSource === 'customer' ? (
        <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl">
          <p className="text-lg font-semibold text-emerald-800 mb-4">
            Since you are providing your own materials, please schedule your material drop-off below.
          </p>
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl animate-fade-in-up">
            <label className="block text-sm font-semibold text-emerald-800 mb-4">
              Select Material Drop-off Date & Time <span className="text-amber-600">*</span>
            </label>
            <div className="mb-6 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                  <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-emerald-600 rounded-full" />
                </div>
              )}

              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                  setMaterialDropoffTime('');

                  if (date) {
                    setMaterialDropoffDate(format(date, 'yyyy-MM-dd'));
                  } else {
                    setMaterialDropoffDate('');
                  }
                }}
                filterDate={(date) => {
                  const key = format(date, 'yyyy-MM-dd');
                  return getDaySlots(key).some((slot) => slot.is_available);
                }}
                onMonthChange={(date) => {
                  const month = date.getMonth() + 1;
                  debouncedFetch(month, date.getFullYear());
                }}
                minDate={new Date()}
                inline
                disabled={isLoading}
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-semibold text-emerald-800 mb-3">
                  Available Material Drop-off Times
                </label>
                {(() => {
                  const dateKey = format(selectedDate, 'yyyy-MM-dd');
                  const slots = getDaySlots(dateKey);

                  if (!slots.length) {
                    return <p className="text-emerald-800/80 text-sm italic">No available slots for this date.</p>;
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
                            setMaterialDropoffTime(time);
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
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl text-center">
          <span className="text-4xl mb-4 block">✅</span>
          <h4 className="text-xl font-bold text-emerald-800 mb-3">Workshop Materials Selected</h4>
          <p className="text-lg text-emerald-700 font-medium">No material drop-off is required! You can proceed to the next step.</p>
        </div>
      )}

      <div className="mt-8 flex gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-stone-300 py-3 font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNextClick}
          disabled={!canProceed}
          className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 font-bold text-white text-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next: Measurements →
        </button>
      </div>
    </div>
  );
}
