import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Orders/StatusBadge';
import ViewDetailsModal from '@/Components/Orders/ViewDetailsModal';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

export default function OrdersPage() {
    const { props } = usePage();
    const shop = props.shop;
    const initialOrders = props.orders || [];
    
    const [orders] = useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [pendingStatusOrder, setPendingStatusOrder] = useState(null);
    
    const [showMeasurementRequestModal, setShowMeasurementRequestModal] = useState(false);
    const [measurementFields, setMeasurementFields] = useState(['']);

    const stats = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        inProgress: orders.filter(o => ['Accepted', 'Appointment Scheduled', 'In Progress'].includes(o.status)).length,
        ready: orders.filter(o => o.status === 'Ready').length,
        completed: orders.filter(o => o.status === 'Completed').length,
    };

    const handleStatusUpdate = (orderId, newStatus, expectedCompletionDate = null) => {
        const payload = { status: newStatus };
        if (expectedCompletionDate) payload.expected_completion_date = expectedCompletionDate;
        
        router.patch(`/store/orders/${orderId}/status`, payload, {
            onSuccess: () => window.location.reload(),
            onError: (errors) => alert(errors.message || 'Failed to update status')
        });
    };

    const handleAcceptClick = (order) => {
        setPendingStatusOrder(order);
        if (order.measurement_type === 'scheduled') {
            setShowAppointmentModal(true);
        } else if (order.measurement_type === 'profile') {
            // Start with one empty row
            setMeasurementFields(['']); 
            setShowMeasurementRequestModal(true);
        } else {
            handleStatusUpdate(order.id, 'Accepted');
        }
    };

    const handleAppointmentSubmit = () => {
        if (!appointmentDate) return alert('Please select an appointment date');
        handleStatusUpdate(pendingStatusOrder.id, pendingStatusOrder.status, appointmentDate);
    };

    const handleMeasurementSubmit = () => {
        // Filter out empty rows
        const requestedArr = measurementFields.map(m => m.trim()).filter(Boolean);
        
        if (requestedArr.length === 0) {
            alert('Please add at least one measurement part.');
            return;
        }
        
        const payload = {
            status: 'Accepted',
            measurement_snapshot: { requested: requestedArr }
        };

        router.patch(`/store/orders/${pendingStatusOrder.id}/status`, payload, {
            onSuccess: () => {
                setShowMeasurementRequestModal(false);
                window.location.reload();
            }
        });
    };

    const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

    const tabs = [
        { id: 'All', label: 'All Orders', count: stats.all },
        { id: 'Pending', label: 'Pending', count: stats.pending },
        { id: 'In Progress', label: 'In Progress', count: stats.inProgress },
        { id: 'Ready', label: 'Ready', count: stats.ready },
        { id: 'Completed', label: 'Completed', count: stats.completed },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Orders Management</h1>
                        <p className="text-stone-600">{shop?.shop_name || 'Your Shop'}</p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-stone-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    filterStatus === tab.id ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${filterStatus === tab.id ? 'bg-amber-200 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    <div className="p-6">
                        {filteredOrders.length === 0 ? (
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
                                <p className="text-stone-500">No orders found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredOrders.map(order => (
                                    <div key={order.id} className="group flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:border-orchid-blue/40 transition-all hover:shadow-lg gap-4 lg:gap-6">
                                        
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
                                                #{order.id}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-stone-800 leading-tight truncate">{order.service?.service_name || 'N/A'}</h4>
                                                <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                                {order.user?.name && <p className="text-sm text-stone-600 truncate">{order.user.name}</p>}
                                            </div>
                                        </div>

                                        <div className="hidden lg:block flex-shrink-0">
                                            <StatusBadge status={order.status} />
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3 lg:gap-6 w-full sm:w-auto sm:ml-auto">
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-lg font-black text-stone-900">₱{Number(order.total_price).toLocaleString()}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Grand Total</p>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
                                                <button onClick={() => setSelectedOrder(order)} className="w-10 h-10 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:bg-orchid-blue hover:text-white transition-all shadow-sm flex-shrink-0">
                                                    →
                                                </button>

                                                {order.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleAcceptClick(order)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap">
                                                            Accept
                                                        </button>
                                                        <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition flex-shrink-0 whitespace-nowrap">
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {order.status === 'Accepted' && (
                                                    <button onClick={() => handleStatusUpdate(order.id, 'In Progress')} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex-shrink-0 whitespace-nowrap">
                                                        Start Work
                                                    </button>
                                                )}
                                                
                                                {(order.status === 'Appointment Scheduled' || order.status === 'In Progress') && (
                                                    <button onClick={() => handleStatusUpdate(order.id, 'Ready')} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex-shrink-0 whitespace-nowrap">
                                                        Mark Ready
                                                    </button>
                                                )}
                                                
                                                {order.status === 'Ready' && (
                                                    <button onClick={() => handleStatusUpdate(order.id, 'Completed')} className="px-4 py-2 bg-stone-600 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition flex-shrink-0 whitespace-nowrap">
                                                        Complete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <ViewDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={true} />

                {showAppointmentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAppointmentModal(false)}>
                        <div className="mx-4 max-w-md w-full rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold text-stone-800 mb-4">Schedule Appointment</h3>
                            <div className="mb-4">
                                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-stone-300 rounded-lg px-4 py-2 text-stone-800" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowAppointmentModal(false); setAppointmentDate(''); }} className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50">Cancel</button>
                                <button onClick={handleAppointmentSubmit} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Schedule</button>
                            </div>
                        </div>
                    </div>
                )}

{showMeasurementRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMeasurementRequestModal(false)}>
                    <div className="mx-4 max-w-lg w-full rounded-2xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">Request Measurements</h3>
                        <p className="text-sm text-stone-600 mb-6">
                            Add the specific parts you need the customer to measure.
                        </p>
                        
                        <div className="mb-8 max-h-[40vh] overflow-y-auto pr-2 space-y-3">
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                Parts to Measure
                            </label>
                            
                            {/* Map through the dynamic rows */}
                            {measurementFields.map((field, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={field}
                                        onChange={(e) => {
                                            const newFields = [...measurementFields];
                                            newFields[index] = e.target.value;
                                            setMeasurementFields(newFields);
                                        }}
                                        className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                                        placeholder="e.g. Chest circumference"
                                    />
                                    {/* Delete Row Button */}
                                    <button
                                        onClick={() => {
                                            const newFields = measurementFields.filter((_, i) => i !== index);
                                            setMeasurementFields(newFields.length ? newFields : ['']);
                                        }}
                                        className="w-11 h-11 flex items-center justify-center bg-stone-100 text-stone-400 hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add Another Part Button */}
                            <button
                                onClick={() => setMeasurementFields([...measurementFields, ''])}
                                className="w-full py-3 mt-2 border-2 border-dashed border-stone-300 text-stone-500 font-bold rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-lg leading-none">+</span> Add Another Part
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowMeasurementRequestModal(false)} className="flex-1 px-4 py-3 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition-colors">Cancel</button>
                            <button onClick={handleMeasurementSubmit} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md transition-colors">Send Request</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AuthenticatedLayout>
    );
}
