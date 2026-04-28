import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

export default function Appointments({ auth, appointmentsByDate = {}, holidaysByDate = {}, month, year }) {
    const [currentDate, setCurrentDate] = useState(new Date((year || new Date().getFullYear()), ((month || new Date().getMonth() + 1) - 1), 1));
    const [selectedDateAppointments, setSelectedDateAppointments] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDayLabel, setSelectedDayLabel] = useState('');

    const displayYear = currentDate.getFullYear();
    const displayMonth = currentDate.getMonth();

    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const normalizedAppointmentsByDate = useMemo(() => appointmentsByDate || {}, [appointmentsByDate]);
    const normalizedHolidaysByDate = useMemo(() => holidaysByDate || {}, [holidaysByDate]);

    const navigateMonth = (newDate) => {
        setCurrentDate(newDate);
        router.get(window.location.pathname, {
            month: newDate.getMonth() + 1,
            year: newDate.getFullYear(),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const prevMonth = () => {
        navigateMonth(new Date(displayYear, displayMonth - 1, 1));
    };

    const nextMonth = () => {
        navigateMonth(new Date(displayYear, displayMonth + 1, 1));
    };

    const formatTime = (timeStart) => {
        if (!timeStart) return 'No Time';
        const hhmm = String(timeStart).slice(0, 5);
        return format(new Date(`1970-01-01T${hhmm}:00`), 'hh:mm a');
    };

    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const openModal = (day, appointments) => {
        setSelectedDateAppointments(appointments);
        setSelectedDayLabel(`${monthNames[displayMonth]} ${day}, ${displayYear}`);
        setIsModalOpen(true);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">My Appointments</h2>}
        >
            <Head title="My Appointments" />

            <div className="py-12 bg-stone-50/50 min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-stone-100 bg-indigo-50/30 flex flex-col gap-4 md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
                                    <FiCalendar className="w-6 h-6 text-indigo-500" />
                                    {monthNames[displayMonth]} <span className="text-indigo-400 font-medium">{displayYear}</span>
                                </h3>
                                <div className="flex flex-wrap gap-4 items-center text-sm mt-3">
                                    <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Legend:</span>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span><span className="text-stone-700 text-xs font-bold">My Bookings</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500"></span><span className="text-stone-700 text-xs font-bold">Holidays</span></div>
                                </div>
                            </div>
                            <div className="flex gap-2 self-start md:self-auto">
                                <button onClick={prevMonth} className="p-3 rounded-xl bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    <FiChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextMonth} className="p-3 rounded-xl bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    <FiChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-7 gap-4 mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                                    <div key={dayName} className="text-center font-bold text-stone-400 text-xs md:text-sm uppercase tracking-widest">
                                        {dayName}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2 md:gap-4">
                                {blanks.map((blank) => (
                                    <div key={`blank-${blank}`} className="aspect-square rounded-2xl bg-stone-50 border border-transparent"></div>
                                ))}

                                {days.map((day) => {
                                    const dayString = format(new Date(displayYear, displayMonth, day), 'yyyy-MM-dd');

                                    const myApts = normalizedAppointmentsByDate[dayString] || [];
                                    const holiday = normalizedHolidaysByDate[dayString];

                                    const hasMyAppointments = myApts.length > 0;
                                    const hasHoliday = Boolean(holiday);

                                    const isToday = new Date().toDateString() === new Date(displayYear, displayMonth, day).toDateString();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => {
                                                if (hasMyAppointments) {
                                                    openModal(day, myApts);
                                                }
                                            }}
                                            className={`aspect-square rounded-2xl border flex flex-col p-2 md:p-3 transition-all ${
                                                hasMyAppointments
                                                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm hover:border-indigo-400 cursor-pointer'
                                                    : isToday
                                                        ? 'bg-stone-50 border-stone-300'
                                                        : 'bg-white border-stone-100'
                                            }`}
                                        >
                                            <span className={`text-sm md:text-lg font-bold ${hasMyAppointments ? 'text-indigo-700' : isToday ? 'text-stone-900' : 'text-stone-500'}`}>
                                                {day}
                                            </span>

                                            {hasMyAppointments && (
                                                <div className="mt-auto flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
                                                    {myApts.slice(0, 3).map((apt, idx) => (
                                                        <div key={`${apt.id}-${idx}`} className="flex items-center gap-1 text-[9px] md:text-xs font-bold text-white px-1.5 py-1 rounded-md truncate bg-indigo-500">
                                                            <span>{formatTime(apt.time_start)}</span>
                                                            <span className="truncate opacity-90">{apt.order?.service?.service_name || 'Appointment'}</span>
                                                        </div>
                                                    ))}
                                                    {myApts.length > 3 && (
                                                        <div className="text-[9px] md:text-xs font-bold text-stone-600 px-1.5 py-1 italic">+{myApts.length - 3} more...</div>
                                                    )}
                                                </div>
                                            )}

                                            {!hasMyAppointments && hasHoliday && (
                                                <div className="mt-auto rounded-md bg-sky-500 text-white text-[9px] md:text-xs font-bold px-1.5 py-1 leading-tight truncate">
                                                    🎉 {holiday}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {isModalOpen && selectedDateAppointments && (
                    <AppointmentsByOrderModal
                        selectedDayLabel={selectedDayLabel}
                        appointments={selectedDateAppointments}
                        formatTime={formatTime}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function AppointmentsByOrderModal({ selectedDayLabel, appointments, formatTime, onClose }) {
    // Group appointments by order_id
    const groupedOrders = useMemo(() => {
        return appointments.reduce((acc, apt) => {
            const orderId = apt.order_id;
            if (!acc[orderId]) {
                acc[orderId] = {
                    orderId,
                    order: apt.order,
                    shop: apt.order?.tailoring_shop,
                    service: apt.order?.service,
                    appointments: [],
                };
            }
            acc[orderId].appointments.push(apt);
            return acc;
        }, {});
    }, [appointments]);

    const groupedOrdersArray = Object.values(groupedOrders).sort(
        (a, b) => new Date(a.appointments[0]?.date) - new Date(b.appointments[0]?.date)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                    <h3 className="text-2xl font-black text-stone-900 flex items-center gap-2">
                        <FiClock className="text-indigo-500" />
                        {selectedDayLabel}
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold text-lg">✕</button>
                </div>

                <div className="space-y-5">
                    {groupedOrdersArray.map((group) => (
                        <div key={group.orderId} className="p-5 rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100 hover:border-indigo-300 transition-colors">
                            {/* Card Header */}
                            <div className="mb-4 pb-4 border-b border-stone-200">
                                <h4 className="font-black text-lg text-stone-900">
                                    {group.shop?.shop_name || 'Shop'} - {group.service?.service_name || 'Service'}
                                </h4>
                                <p className="text-sm text-stone-600 font-medium mt-1">Order #{group.orderId}</p>
                            </div>

                            {/* Card Body - Appointments */}
                            <div className="space-y-2 mb-4">
                                {group.appointments.map((apt, idx) => (
                                    <div key={`${apt.id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-stone-150 hover:bg-indigo-50/30 transition-colors">
                                        <span className="font-black text-indigo-700 text-sm w-16 flex-shrink-0">{formatTime(apt.time_start)}</span>
                                        <span className="text-sm font-bold text-stone-700 flex-1">{apt.order?.service?.service_name || 'Appointment'}</span>
                                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                                            {apt.order?.status || 'confirmed'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Card Footer - Action */}
                            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                                <span className="text-sm font-bold text-stone-600">Balance:</span>
                                <div className="text-right">
                                    <span className="text-lg font-black text-indigo-900 leading-none">₱{Number(group.order?.total_price ?? 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <Link
                                href={`/my-orders/${group.orderId}`}
                                className="mt-4 block w-full text-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                            >
                                View Order Details →
                            </Link>
                        </div>
                    ))}

                    {groupedOrdersArray.length === 0 && (
                        <div className="text-center py-8 text-stone-600 font-medium">
                            No appointments scheduled for this day.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

