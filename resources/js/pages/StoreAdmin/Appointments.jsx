import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiCalendar, FiClock, FiChevronLeft, FiChevronRight, FiUser, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { confirmDialog } from '@/utils/dialog';
import { format, getDay, isValid, parseISO } from 'date-fns';

export default function Appointments({ auth, appointmentsByDate = {}, exceptionsByDate = {}, holidaysByDate = {}, shop, month, year }) {
    const [currentDate, setCurrentDate] = useState(new Date((year || new Date().getFullYear()), ((month || new Date().getMonth() + 1) - 1), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const displayYear = currentDate.getFullYear();
    const displayMonth = currentDate.getMonth();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const navigateMonth = (date) => {
        setCurrentDate(date);
        router.get(route('store.appointments'), {
            month: date.getMonth() + 1,
            year: date.getFullYear(),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const prevMonth = () => {
        const newDate = new Date(displayYear, displayMonth - 1, 1);
        setCurrentDate(newDate);
        router.get(window.location.pathname, {
            month: newDate.getMonth() + 1,
            year: newDate.getFullYear(),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const nextMonth = () => {
        const newDate = new Date(displayYear, displayMonth + 1, 1);
        setCurrentDate(newDate);
        router.get(window.location.pathname, {
            month: newDate.getMonth() + 1,
            year: newDate.getFullYear(),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const normalizedAppointmentsByDate = useMemo(() => appointmentsByDate || {}, [appointmentsByDate]);
    const normalizedExceptionsByDate = useMemo(() => exceptionsByDate || {}, [exceptionsByDate]);
    const normalizedHolidaysByDate = useMemo(() => holidaysByDate || {}, [holidaysByDate]);
    const weeklyScheduleByDay = useMemo(() => {
        const schedules = Array.isArray(shop?.schedules) ? shop.schedules : [];
        return schedules.reduce((acc, schedule) => {
            const dayOfWeek = Number(schedule.day_of_week);
            acc[dayOfWeek] = {
                is_open: Boolean(schedule.is_open),
                open_time: schedule.open_time || null,
                close_time: schedule.close_time || null,
            };
            return acc;
        }, {});
    }, [shop?.schedules]);

    const formatTime = (timeStart) => {
        if (!timeStart) return 'No Time';
        const hhmm = String(timeStart).slice(0, 5);
        return format(new Date(`1970-01-01T${hhmm}:00`), 'hh:mm a');
    };

    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const openDayModal = (day) => {
        const dayString = format(new Date(displayYear, displayMonth, day), 'yyyy-MM-dd');
        setSelectedDate({ day, dayString, displayMonth, displayYear });
        setIsModalOpen(true);
    };

    const closeDayModal = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col">
                    <h2 className="font-black text-2xl text-stone-900 tracking-tight">Master Schedule</h2>
                    <p className="text-stone-500 text-sm">{shop.shop_name}</p>
                </div>
            }
        >
            <Head title="Master Schedule" />

            <div className="py-8 bg-stone-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 overflow-hidden">
                        {/* Header & Legend */}
                        <div className="p-6 md:p-8 border-b border-stone-100 bg-amber-50/30 flex flex-col gap-4 md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-amber-900 flex items-center gap-3">
                                    <FiCalendar className="w-6 h-6 text-amber-500" />
                                    {monthNames[displayMonth]} <span className="text-amber-500 font-medium">{displayYear}</span>
                                </h3>
                                <div className="flex flex-wrap gap-4 items-center text-sm mt-3">
                                    <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Legend:</span>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span><span className="text-stone-700 text-xs font-bold">Bookings</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span className="text-stone-700 text-xs font-bold">Holiday</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-stone-400"></span><span className="text-stone-700 text-xs font-bold">Regularly Closed</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-stone-800"></span><span className="text-stone-700 text-xs font-bold">Exception: Closed</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-stone-700 text-xs font-bold">Exception: Open</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-stone-700 text-xs font-bold">Modified Hours</span></div>
                                </div>
                            </div>
                            <div className="flex gap-2 self-start md:self-auto">
                                <button onClick={prevMonth} className="p-3 rounded-xl bg-white border border-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                    <FiChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextMonth} className="p-3 rounded-xl bg-white border border-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                    <FiChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-7 gap-4 mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center font-bold text-stone-400 text-xs md:text-sm uppercase tracking-widest">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2 md:gap-4">
                                {blanks.map(blank => <div key={`blank-${blank}`} className="aspect-square rounded-2xl bg-stone-50 border border-transparent"></div>)}
                                
                                {days.map(day => {
                                    const dayString = format(new Date(displayYear, displayMonth, day), 'yyyy-MM-dd');
                                    const parsedDay = parseISO(dayString);
                                    const safeDate = isValid(parsedDay) ? parsedDay : new Date(displayYear, displayMonth, day);
                                    const dayOfWeek = getDay(safeDate);
                                    const dayOfWeekLegacy = dayOfWeek === 0 ? 7 : dayOfWeek;
                                    const dayAppointments = normalizedAppointmentsByDate[dayString] || [];
                                    const dayException = normalizedExceptionsByDate[dayString];
                                    const dayHoliday = normalizedHolidaysByDate[dayString];
                                    const isHoliday = Boolean(dayHoliday);
                                    const baseSchedule = weeklyScheduleByDay[dayOfWeek] ?? weeklyScheduleByDay[dayOfWeekLegacy] ?? null;
                                    const isRegularlyClosed = baseSchedule ? baseSchedule.is_open === false : false;
                                    const defaultIsClosed = isHoliday || isRegularlyClosed;

                                    const isClosedException = Boolean(dayException?.is_closed);
                                    const hasModifiedHours = Boolean(dayException && !dayException.is_closed);
                                    const hasAppointments = dayAppointments.length > 0;
                                    const isConflict = hasAppointments && isClosedException;
                                    const isExceptionToOpen = Boolean(dayException && !dayException.is_closed && defaultIsClosed);

                                    const isToday = new Date().toDateString() === new Date(displayYear, displayMonth, day).toDateString();

                                    // Base Layer Styling
                                    let baseLayerClass = 'status-standard';
                                    let cellBackgroundClass = isToday ? 'bg-stone-50 border-stone-300' : 'bg-white border-stone-100';
                                    
                                    if (isClosedException) {
                                        baseLayerClass = 'status-exception-close';
                                        cellBackgroundClass = 'bg-stone-700 border-stone-800 text-white';
                                    } else if (isExceptionToOpen) {
                                        baseLayerClass = 'status-exception-open';
                                        cellBackgroundClass = 'bg-emerald-50 border-emerald-300';
                                    } else if (hasModifiedHours) {
                                        baseLayerClass = 'status-modified-hours';
                                        cellBackgroundClass = 'bg-amber-50 border-amber-200';
                                    } else if (isHoliday) {
                                        baseLayerClass = 'status-holiday';
                                        cellBackgroundClass = 'bg-rose-100 border-rose-300';
                                    } else if (isRegularlyClosed) {
                                        baseLayerClass = 'status-regular-closed';
                                        cellBackgroundClass = 'bg-stone-100 border-stone-300';
                                    } else if (hasAppointments) {
                                        baseLayerClass = 'status-has-appointments';
                                        cellBackgroundClass = 'bg-indigo-50/50 border-indigo-200 shadow-sm';
                                    }

                                    return (
                                        <div 
                                            key={day} 
                                            onClick={() => openDayModal(day)}
                                            className={`aspect-square rounded-2xl border flex flex-col p-2 md:p-3 transition-all cursor-pointer hover:scale-[1.01] ${cellBackgroundClass} ${baseLayerClass}`}
                                        >
                                            <span className={`text-sm md:text-lg font-bold ${isClosedException ? 'text-white' : hasAppointments ? 'text-indigo-700' : isToday ? 'text-stone-900' : 'text-stone-500'}`}>{day}</span>
                                            
                                            {/* Conflict Badge - Overlay */}
                                            {isConflict && (
                                                <div className="mt-2 flex items-center gap-1 rounded-md bg-red-600 text-white text-[9px] md:text-xs font-black px-1.5 py-1 leading-tight">
                                                    <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                                                    <span>CONFLICT</span>
                                                </div>
                                            )}

                                            {/* Closed Badge - Overlay */}
                                            {isClosedException && !isConflict && (
                                                <div className="mt-2 rounded-md bg-stone-900 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight">
                                                    Closed Override: {dayException.reason ?? 'Exception'}
                                                </div>
                                            )}

                                            {/* Exception to Open Badge */}
                                            {isExceptionToOpen && (
                                                <div className="mt-2 rounded-md bg-emerald-600 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight">
                                                    Open Override: {formatTime(dayException.open_time)} - {formatTime(dayException.close_time)}
                                                </div>
                                            )}

                                            {/* Modified Hours Badge - Overlay */}
                                            {hasModifiedHours && !isConflict && !isExceptionToOpen && (
                                                <div className="mt-2 rounded-md bg-amber-500 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight">
                                                    ⚠️ {formatTime(dayException.open_time)} - {formatTime(dayException.close_time)}
                                                </div>
                                            )}

                                            {/* Holiday Badge - Overlay */}
                                            {isHoliday && !dayException && (
                                                <div className="mt-2 rounded-md bg-rose-500 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight truncate">
                                                    🎉 {dayHoliday}
                                                </div>
                                            )}

                                            {/* Regularly closed note */}
                                            {isRegularlyClosed && !isHoliday && !dayException && (
                                                <div className="mt-2 rounded-md bg-stone-400 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight">
                                                    Regularly Closed
                                                </div>
                                            )}

                                            {/* Appointments - Overlay */}
                                            {!isClosedException && hasAppointments && (
                                                <div className="mt-auto flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
                                                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                                                        <div key={`${apt.id}-${idx}`} className="flex items-center gap-1 text-[9px] md:text-xs font-bold text-white px-1.5 py-1 rounded-md truncate bg-indigo-500">
                                                            <span>{formatTime(apt.time_start)}</span>
                                                            <span className="truncate opacity-80">({apt.user?.name || 'User'})</span>
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 3 && (
                                                        <div className="text-[9px] md:text-xs font-bold text-stone-600 px-1.5 py-1 italic">+{dayAppointments.length - 3} more...</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Schedule & Exception Manager Modal */}
            {isModalOpen && selectedDate && (
                <DailyRosterModal
                    selectedDate={selectedDate}
                    appointmentsByDate={normalizedAppointmentsByDate}
                    exceptionsByDate={normalizedExceptionsByDate}
                    holidaysByDate={normalizedHolidaysByDate}
                    weeklyScheduleByDay={weeklyScheduleByDay}
                    monthNames={monthNames}
                    formatTime={formatTime}
                    shop={shop}
                    onClose={closeDayModal}
                />
            )}
        </AuthenticatedLayout>
    );
}

function DailyRosterModal({ selectedDate, appointmentsByDate, exceptionsByDate, holidaysByDate, weeklyScheduleByDay, monthNames, formatTime, shop, onClose }) {
    const dayAppointments = (appointmentsByDate[selectedDate.dayString] || [])
        .sort((a, b) => String(a.time_start || '').localeCompare(String(b.time_start || '')));
    
    const dayException = exceptionsByDate[selectedDate.dayString];
    const parsedDay = parseISO(selectedDate.dayString);
    const safeDate = isValid(parsedDay) ? parsedDay : new Date(selectedDate.displayYear, selectedDate.displayMonth, selectedDate.day);
    const dayOfWeek = getDay(safeDate);
    const dayOfWeekLegacy = dayOfWeek === 0 ? 7 : dayOfWeek;
    const isHoliday = Boolean(holidaysByDate[selectedDate.dayString]);
    const baseSchedule = weeklyScheduleByDay[dayOfWeek] ?? weeklyScheduleByDay[dayOfWeekLegacy] ?? null;
    const isRegularlyClosed = baseSchedule ? baseSchedule.is_open === false : false;
    const defaultIsClosed = isHoliday || isRegularlyClosed;
    const baseOpenTime = baseSchedule?.open_time ? formatTime(baseSchedule.open_time) : null;
    const baseCloseTime = baseSchedule?.close_time ? formatTime(baseSchedule.close_time) : null;

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        date: selectedDate.dayString,
        open_time: dayException?.open_time ? String(dayException.open_time).slice(0, 5) : '',
        close_time: dayException?.close_time ? String(dayException.close_time).slice(0, 5) : '',
        reason: dayException?.reason ?? '',
    });

    const [toggleChecked, setToggleChecked] = useState(false);

    useEffect(() => {
        const hasOpenException = Boolean(dayException && dayException.is_closed === false);
        const hasCloseException = Boolean(dayException && dayException.is_closed === true);
        const initialChecked = defaultIsClosed ? hasOpenException : hasCloseException;

        setToggleChecked(initialChecked);
        setData({
            date: selectedDate.dayString,
            open_time: dayException?.open_time ? String(dayException.open_time).slice(0, 5) : '',
            close_time: dayException?.close_time ? String(dayException.close_time).slice(0, 5) : '',
            reason: dayException?.reason ?? '',
        });
    }, [defaultIsClosed, dayException, selectedDate.dayString, setData]);

    const shouldSendClosed = defaultIsClosed ? false : toggleChecked;
    const showTimeInputs = defaultIsClosed ? toggleChecked : !toggleChecked;
    const toggleLabel = defaultIsClosed ? 'Make an Exception to Open Today' : 'Close Entire Day';
    const modeHint = defaultIsClosed
        ? 'Base state is closed (holiday or regular schedule). Enable this to open today with custom hours.'
        : 'Base state is open. Toggle ON to close the whole day, or keep OFF and define modified hours.';
    const baseStatusLabel = isHoliday
        ? 'Base: Closed (Holiday)'
        : isRegularlyClosed
            ? 'Base: Closed (Regular Schedule)'
            : 'Base: Open (Regular Schedule)';
    const baseStatusClass = defaultIsClosed
        ? 'bg-stone-200 text-stone-800 border-stone-300'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    const overrideStatusLabel = dayException
        ? (dayException.is_closed ? 'Override: Closed' : `Override: Open ${formatTime(dayException.open_time)}-${formatTime(dayException.close_time)}`)
        : null;
    const overrideStatusClass = dayException?.is_closed
        ? 'bg-stone-700 text-white border-stone-800'
        : 'bg-emerald-600 text-white border-emerald-700';
    const baseHoursLabel = isHoliday
        ? 'Base Hours: Closed due to holiday'
        : isRegularlyClosed
            ? 'Base Hours: Closed (regular schedule)'
            : baseOpenTime && baseCloseTime
                ? `Base Hours: ${baseOpenTime} - ${baseCloseTime}`
                : 'Base Hours: Not configured';
    const effectiveHoursLabel = dayException
        ? dayException.is_closed
            ? 'Effective Today: Closed by exception'
            : `Effective Today: ${formatTime(dayException.open_time)} - ${formatTime(dayException.close_time)} (exception)`
        : isHoliday
            ? 'Effective Today: Closed (holiday)'
            : isRegularlyClosed
                ? 'Effective Today: Closed (regular schedule)'
                : baseOpenTime && baseCloseTime
                    ? `Effective Today: ${baseOpenTime} - ${baseCloseTime}`
                    : 'Effective Today: Not configured';

    const handleExceptionSubmit = (e) => {
        e.preventDefault();

        if (defaultIsClosed && !toggleChecked) {
            return;
        }

        if (!shouldSendClosed && (!data.open_time || !data.close_time)) {
            return;
        }

        const payload = {
            date: selectedDate.dayString,
            is_closed: shouldSendClosed,
            open_time: shouldSendClosed ? null : data.open_time,
            close_time: shouldSendClosed ? null : data.close_time,
            reason: data.reason,
        };

        if (dayException?.id) {
            patch(route('store.exceptions.update', dayException.id), {
                data: payload,
                onSuccess: () => {
                    router.reload();
                },
            });
        } else {
            post(route('store.exceptions.store'), {
                data: payload,
                onSuccess: () => {
                    router.reload();
                },
            });
        }
    };

    const handleExceptionDelete = async () => {
        if (!dayException?.id) return;

        const confirmed = await confirmDialog({
            title: 'Remove Exception',
            message: 'Remove this exception?',
            confirmText: 'Remove',
            cancelText: 'Cancel',
            type: 'error',
        });

        if (!confirmed) return;

        destroy(route('store.exceptions.destroy', dayException.id), {
            onSuccess: () => {
                reset();
                router.reload();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-stone-900 flex items-center gap-2">
                            <FiClock className="text-amber-500" />
                            {monthNames[selectedDate.displayMonth]} {selectedDate.day}, {selectedDate.displayYear}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${baseStatusClass}`}>
                                {baseStatusLabel}
                            </span>
                            {overrideStatusLabel && (
                                <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${overrideStatusClass}`}>
                                    {overrideStatusLabel}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold text-lg">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Section A: Chronological Roster */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-black text-stone-900 mb-4">Chronological Roster</h4>
                        <div className="space-y-2">
                            <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
                                {baseHoursLabel}
                            </div>
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800">
                                {effectiveHoursLabel}
                            </div>
                        </div>
                        {dayAppointments.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-stone-600 text-sm font-medium">
                                No appointments scheduled for this day.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dayAppointments.map((apt) => (
                                    <div key={apt.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 hover:border-indigo-300 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-bold text-indigo-700 text-lg">{formatTime(apt.time_start)}</div>
                                            <span className="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider text-white bg-indigo-500">
                                                {apt.order?.status || 'confirmed'}
                                            </span>
                                        </div>
                                        <p className="font-black text-stone-900">{apt.order?.service?.service_name ?? 'Service'}</p>
                                        <div className="flex items-center gap-2 mt-2 text-stone-600 text-sm">
                                            <FiUser className="text-stone-400 w-4 h-4" />
                                            {apt.user?.name ?? 'Unknown'}
                                        </div>
                                        <Link
                                            href={`/store/orders/${shop.id}`}
                                            className="mt-3 inline-block text-xs font-bold text-amber-600 hover:text-amber-800"
                                        >
                                            Order #{apt.order_id || apt.id} →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section B: Exception Manager */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-black text-stone-900 mb-4">Exception Manager</h4>
                        <form onSubmit={handleExceptionSubmit} className="space-y-4">
                            <p className="text-xs font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2">
                                {modeHint}
                            </p>

                            {defaultIsClosed && !toggleChecked && !dayException && (
                                <div className="rounded-lg bg-stone-100 border border-stone-300 text-stone-700 text-sm font-medium px-3 py-2">
                                    This day remains closed unless you create an exception to open it.
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={toggleChecked}
                                        onChange={(e) => setToggleChecked(e.target.checked)}
                                        className="w-4 h-4 rounded border-stone-300"
                                    />
                                    <span className="text-sm font-bold text-stone-700">{toggleLabel}</span>
                                </label>
                            </div>

                            {showTimeInputs && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Open Time</label>
                                        <input
                                            type="time"
                                            value={data.open_time}
                                            onChange={(e) => setData('open_time', e.target.value)}
                                            className="w-full rounded-xl border border-stone-300 px-3 py-2"
                                            required
                                        />
                                        {errors.open_time && <p className="text-red-600 text-sm mt-1">{errors.open_time}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Close Time</label>
                                        <input
                                            type="time"
                                            value={data.close_time}
                                            onChange={(e) => setData('close_time', e.target.value)}
                                            className="w-full rounded-xl border border-stone-300 px-3 py-2"
                                            required
                                        />
                                        {errors.close_time && <p className="text-red-600 text-sm mt-1">{errors.close_time}</p>}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">Reason (optional)</label>
                                <input
                                    type="text"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="e.g., Holiday, Inventory Day, Private Event"
                                    className="w-full rounded-xl border border-stone-300 px-3 py-2"
                                />
                                {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {processing ? 'Saving...' : dayException ? 'Update Exception' : 'Create Exception'}
                                </button>
                                {dayException && (
                                    <button
                                        type="button"
                                        onClick={handleExceptionDelete}
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-60 flex items-center gap-2"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

