import React from 'react';
import StatusBadge from './StatusBadge';
import TimelineNode from './TimelineNode';
import DateRow from './DateRow';
import SpecRow from './SpecRow';

export default function ViewDetailsModal({ order, onClose, isAdmin = false }) {
if (!order) return null;

    const profile = order?.user?.profile || {};

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                {/* Header */}
                <div className="p-8 border-b border-stone-100 flex justify-between items-start bg-stone-50/30">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Order #{order.id}</h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">
                            Project Initiated: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-all font-bold">✕</button>
                </div>

                {/* Timeline */}
                <div className="px-12 py-6 bg-white border-b border-stone-50 relative">
                    <div className="absolute top-[35px] left-[15%] right-[15%] h-[2px] bg-stone-100 z-0" />
                    <div className="flex justify-between items-center relative z-10">
                        <TimelineNode label="Confirmed" date={order.created_at} active={true} />
                        <TimelineNode label="Measured" date={order.appointment_date} active={!!order.appointment_date || order.status !== 'Pending'} />
                        <TimelineNode label="In Work" active={['Accepted', 'Appointment Scheduled', 'In Progress'].includes(order.status)} />
                        <TimelineNode label="Pickup" date={order.expected_completion_date} active={order.status === 'Ready' || order.status === 'Completed'} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 grid md:grid-cols-2 gap-12">
                    {/* Left: Scheduling */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Workshop Scheduling</h3>
                            <div className="space-y-3 bg-stone-50/50 p-6 rounded-3xl border border-stone-100 shadow-sm">
                                <DateRow 
                                    label="📅 Measurement Appointment" 
                                    date={order.appointment_date} 
                                    isAdmin={isAdmin} 
                                    onEdit={() => console.log('Edit measurement date')} 
                                />
                                <DateRow 
                                    label="📦 Material Drop-Off" 
                                    date={order.material_dropoff_date || order.drop_off_date} 
                                    isAdmin={isAdmin} 
                                    onEdit={() => console.log('Edit drop-off date')} 
                                />
                                <DateRow 
                                    label="🏁 Expected Pickup" 
                                    date={order.expected_completion_date} 
                                    isAdmin={isAdmin} 
                                    onEdit={() => console.log('Edit pickup date')} 
                                    isHighlight 
                                />
                            </div>
                        </section>
                        <section className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-75 mb-2">Total Invoice</p>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-bold opacity-90">Grand Total</span>
                                <span className="text-3xl font-black">₱{Number(order.total_price).toLocaleString()}</span>
                            </div>
                        </section>
                    </div>

                    {/* Right: Technical Specs */}
                    <div className="space-y-8">
                        <section className="p-8 rounded-3xl border-2 border-violet-100 bg-violet-50/50 shadow-lg">
                            <h3 className="text-[11px] font-black text-violet-800 uppercase tracking-[0.2em] mb-6">Tailoring Measurements</h3>
<div className="grid grid-cols-2 gap-6">
                                <SpecRow label="CHEST" value={profile.chest ? `${profile.chest} IN` : 'Not Measured'} />
                                <SpecRow label="WAIST" value={profile.waist ? `${profile.waist} IN` : 'Not Measured'} />
                                <SpecRow label="SHOULDER" value={profile.shoulder_width ? `${profile.shoulder_width} IN` : 'Not Measured'} />
                                <SpecRow label="SLEEVE" value={profile.sleeve_length ? `${profile.sleeve_length} IN` : 'Not Measured'} />
                                <SpecRow label="INSEAM" value={profile.inseam ? `${profile.inseam} IN` : 'Not Measured'} />
                                <SpecRow label="NECK" value={profile.neck ? `${profile.neck} IN` : 'Not Measured'} />
                            </div>
                        </section>
                        <section>
                            <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Tailor&apos;s Notes</h3>
                            <div className="bg-stone-50 p-6 rounded-3xl italic text-stone-700 border-l-8 border-purple-300 shadow-inner">
                                `{order.notes || 'Standard bespoke construction. Double-stitched seams. Italian silk lining recommended.'}`
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer: Workshop Log (Admin only) + Actions */}
                {isAdmin && (
                    <div className="p-8 bg-gradient-to-r from-purple-50 to-violet-50 border-t border-purple-100">
                        <h4 className="text-sm font-black text-purple-800 uppercase tracking-wider mb-4">Workshop Timeline</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-3 text-purple-700">
                                <div className="w-2 h-2 bg-purple-400 rounded-full" /> Confirmed Order • {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            {order.appointment_date && (
                                <div className="flex items-center gap-3 text-stone-600">
                                    <div className="w-2 h-2 bg-stone-400 rounded-full" /> Appointment Booked • {new Date(order.appointment_date).toLocaleDateString()}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="w-2 h-2 bg-green-400 rounded-full" /> Current: {order.status}
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isAdmin ? 'text-purple-600' : 'text-stone-400'}`}>
                        {isAdmin ? 'Admin View • Quick Actions Available' : 'Customer Portal'}
                    </span>
                    <button 
                        onClick={onClose}
                        className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                            isAdmin 
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700' 
                                : 'border-2 border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white'
                        }`}
                    >
                        {isAdmin ? 'Close Panel' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
