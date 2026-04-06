import React from 'react';
import StatusBadge from './StatusBadge';
import TimelineNode from './TimelineNode';
import DateRow from './DateRow';
import SpecRow from './SpecRow';

export default function ViewDetailsModal({ order, onClose, isAdmin = false }) {
    if (!order) return null;

    const profile = order?.user?.profile || order?.customer || {};
    const requestedMeasurements = order.measurement_snapshot?.requested || [];

    const getMaterialSourceText = (source) => {
        if (source === 'customer') return 'Customer Provided';
        if (source === 'tailor_choice' || source === 'shop') return 'Workshop Provided';
        return 'Not Specified';
    };

    const getMeasurementText = (type) => {
        if (type === 'scheduled') return 'In-Shop Fitting';
        if (type === 'profile') return 'Self-Measured (Profile)';
        return 'Not Specified';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="p-8 border-b border-stone-100 flex justify-between items-start bg-stone-50/30">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Order #{order.id}</h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-xl font-bold text-stone-700">{order.service?.service_name}</h3>
                            {/* Service Category Added Here */}
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-md">
                                {order.service?.serviceCategory?.name || order.service?.service_category?.name || 'Custom Service'}
                            </span>
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-3">
                            Placed: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-all font-bold">✕</button>
                </div>

                {/* Timeline */}
                <div className="px-12 py-6 bg-white border-b border-stone-100 relative">
                    <div className="absolute top-[35px] left-[15%] right-[15%] h-[2px] bg-stone-100 z-0" />
                    <div className="flex justify-between items-center relative z-10">
                        <TimelineNode label="Confirmed" date={order.created_at} active={true} />
                        <TimelineNode label="Measured" date={order.measurement_date} active={!!order.measurement_date || !['Pending', 'Cancelled'].includes(order.status)} />
                        <TimelineNode label="In Work" active={['Accepted', 'Appointment Scheduled', 'In Progress'].includes(order.status)} />
                        <TimelineNode label="Pickup" date={order.expected_completion_date} active={order.status === 'Ready' || order.status === 'Completed'} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        
                        {/* LEFT COLUMN: Design Context (Takes up 2/3 of the space) */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Design Context</h3>
                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 flex flex-col md:flex-row gap-6">
                                    {/* Design Image */}
                                    <div className="w-full md:w-1/3 aspect-[3/4] bg-stone-200 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                                        {order.design_image ? (
                                            <img src={`/storage/${order.design_image}`} alt="Design Reference" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <span className="text-xs font-medium uppercase tracking-wider">No Image Provided</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Context Details */}
                                    <div className="flex-1 space-y-6">
                                        {order.style_tag && (
                                            <div>
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Style Tag</span>
                                                <span className="inline-block px-4 py-2 bg-white border border-stone-200 text-stone-800 rounded-xl text-sm font-bold shadow-sm">
                                                    {order.style_tag}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Requested Attributes & Items</span>
                                            {order.items && order.items.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    {order.items.map((item, idx) => {
                                                        // Attribute Category Added Here
                                                        const attrCategory = item.attribute?.attributeCategory?.name || item.attribute?.attribute_category?.name || 'Specification';
                                                        const attrName = item.attribute?.name || 'Custom Add-on';
                                                        
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center p-3 bg-white border border-stone-200 rounded-xl shadow-sm">
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block mb-0.5">{attrCategory}</span>
                                                                    <span className="text-sm font-bold text-stone-800">{attrName}</span>
                                                                </div>
                                                                <span className="text-sm font-black text-indigo-600">+₱{item.price}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">No specific attributes requested.</p>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Customer Notes</span>
                                            <p className="text-sm text-stone-700 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                                                {order.notes || 'No additional notes provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Project Logistics</h3>
                                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Materials</p>
                                        <p className="text-sm font-semibold text-stone-800">{getMaterialSourceText(order.material_source)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Fit Method</p>
                                        <p className="text-sm font-semibold text-stone-800">{getMeasurementText(order.measurement_type)}</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Dates & Measurements (Takes up 1/3 of the space) */}
                        <div className="space-y-8">
                            
                            <section className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
                                <h3 className="text-[11px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-6">Measurements</h3>
                                
                                {order.measurement_type === 'scheduled' ? (
                                    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-indigo-100">
                                        <div className="text-3xl mb-3">📍</div>
                                        <h4 className="font-bold text-indigo-900 mb-1">In-Shop Fitting</h4>
                                        <p className="text-xs text-indigo-600">Measurements will be taken professionally at the workshop.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {requestedMeasurements.length > 0 ? (
                                            requestedMeasurements.map((measure, idx) => {
                                                // Intelligent mapping: attempts to map custom text like "Chest circumference" to "chest_circumference" in the DB.
                                                const profileKey = measure.toLowerCase().replace(/ /g, '_');
                                                const val = profile[profileKey];

                                                return (
                                                    <SpecRow 
                                                        key={idx} 
                                                        label={measure.toUpperCase()} 
                                                        value={val ? `${val} IN` : 'Pending Entry'} 
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-indigo-100">
                                                <p className="text-xs text-indigo-600 font-medium">Awaiting shop measurement request.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] mb-4">Schedule</h3>
                                <DateRow label="📅 Fitting Appointment" date={order.measurement_date} isAdmin={isAdmin} />
                                <DateRow label="📦 Material Drop-Off" date={order.material_dropoff_date} isAdmin={isAdmin} />
                                <DateRow label="🏁 Expected Pickup" date={order.expected_completion_date} isAdmin={isAdmin} isHighlight />
                            </section>

                            <section className="p-6 rounded-3xl bg-stone-900 text-white shadow-xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-2">Total Invoice</p>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-bold opacity-90">Grand Total</span>
                                    <span className="text-3xl font-black text-amber-400">₱{Number(order.total_price).toLocaleString()}</span>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isAdmin ? 'text-indigo-600' : 'text-stone-400'}`}>
                        {isAdmin ? 'Admin Portal • Order Details' : 'Customer Portal • Order Details'}
                    </span>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider bg-white border-2 border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white transition-all shadow-sm"
                    >
                        Close Panel
                    </button>
                </div>
            </div>
        </div>
    );
}
